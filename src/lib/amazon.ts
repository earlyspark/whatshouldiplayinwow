import { z } from "zod";
import { Redis } from "@upstash/redis";
import { redisConfig } from "@/lib/redis-config";
import {
  CREATORS_API_HOST,
  COGNITO_SCOPE,
  LWA_SCOPE,
  adSelection,
  amazonConfig,
  type AmazonConfig,
} from "@/lib/amazon-config";

/**
 * Minimal Amazon Creators API client for affiliate banner content.
 *
 * Flow: exchange the credential id/secret for a bearer token via the OAuth2
 * client_credentials grant, then POST to the catalog endpoints. Tokens live for
 * an hour, so they are cached in module scope and refreshed with a safety
 * buffer rather than requested per call, which is the fastest way to get
 * throttled.
 *
 * Product data is cached separately. The Associates Program Operating
 * Agreement requires that displayed prices are no more than 24 hours old, so
 * the TTL is capped below that.
 */

const TOKEN_EXPIRY_BUFFER_SECONDS = 30;
const DEFAULT_TOKEN_LIFETIME_SECONDS = 3600;
/** Product cache lifetime. Kept well under the 24 hour price freshness rule. */
const PRODUCT_TTL_SECONDS = 6 * 60 * 60;
const REQUEST_TIMEOUT_MS = 8000;
const CACHE_PREFIX = "wow-forever-amazon";

const PRODUCT_RESOURCES = [
  "images.primary.large",
  "itemInfo.title",
  "offersV2.listings.price",
] as const;

export interface AmazonProduct {
  asin: string;
  title: string;
  /** Affiliate link returned by Amazon, already carrying the partner tag. */
  url: string;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  /** Localised price string as Amazon formatted it, e.g. "$19.99". */
  price: string | null;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

declare global {
  var __amazonToken: TokenCache | undefined;
  var __amazonProducts: Map<string, { value: AmazonProduct[]; expiresAt: number }> | undefined;
}

const memoryCache =
  globalThis.__amazonProducts ?? new Map<string, { value: AmazonProduct[]; expiresAt: number }>();
if (process.env.NODE_ENV !== "production") globalThis.__amazonProducts = memoryCache;

/* -------------------------------------------------------------------------- */
/* Response parsing                                                           */
/* -------------------------------------------------------------------------- */

const imageSizeSchema = z.object({
  url: z.string().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
});

const itemSchema = z.object({
  asin: z.string(),
  detailPageURL: z.string().optional(),
  images: z.object({ primary: z.object({ large: imageSizeSchema.optional() }).optional() }).optional(),
  itemInfo: z.object({ title: z.object({ displayValue: z.string().optional() }).optional() }).optional(),
  offersV2: z
    .object({
      listings: z
        .array(z.object({ price: z.object({ money: z.object({ displayAmount: z.string().optional() }).optional() }).optional() }))
        .optional(),
    })
    .optional(),
});

const catalogResponseSchema = z.object({
  itemsResult: z.object({ items: z.array(itemSchema).optional() }).optional(),
  searchResult: z.object({ items: z.array(itemSchema).optional() }).optional(),
});

type CatalogItem = z.infer<typeof itemSchema>;

function toProduct(item: CatalogItem): AmazonProduct | null {
  const title = item.itemInfo?.title?.displayValue;
  const url = item.detailPageURL;
  // Without a title and a tagged link there is nothing compliant to render.
  if (!title || !url) return null;
  const image = item.images?.primary?.large;
  return {
    asin: item.asin,
    title,
    url,
    imageUrl: image?.url ?? null,
    imageWidth: image?.width ?? null,
    imageHeight: image?.height ?? null,
    price: item.offersV2?.listings?.[0]?.price?.money?.displayAmount ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

async function fetchToken(config: AmazonConfig): Promise<string> {
  const body = {
    grant_type: "client_credentials",
    client_id: config.credentialId,
    client_secret: config.credentialSecret,
    scope: config.isLwa ? LWA_SCOPE : COGNITO_SCOPE,
  };

  // Login with Amazon (3.x) takes JSON; Cognito (2.x) takes form encoding.
  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "Content-Type": config.isLwa ? "application/json" : "application/x-www-form-urlencoded" },
    body: config.isLwa ? JSON.stringify(body) : new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    throw new Error(`Amazon token request failed with status ${response.status}`);
  }

  const parsed = z
    .object({ access_token: z.string(), expires_in: z.number().optional() })
    .safeParse(await response.json());
  if (!parsed.success) throw new Error("Amazon token response did not contain an access token.");

  const lifetime = parsed.data.expires_in ?? DEFAULT_TOKEN_LIFETIME_SECONDS;
  globalThis.__amazonToken = {
    token: parsed.data.access_token,
    expiresAt: Date.now() + (lifetime - TOKEN_EXPIRY_BUFFER_SECONDS) * 1000,
  };
  return parsed.data.access_token;
}

async function accessToken(config: AmazonConfig): Promise<string> {
  const cached = globalThis.__amazonToken;
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  return fetchToken(config);
}

/** Exported for tests. Drops the cached token so the next call re-authenticates. */
export function clearAmazonToken() {
  globalThis.__amazonToken = undefined;
  memoryCache.clear();
}

/* -------------------------------------------------------------------------- */
/* Catalog requests                                                           */
/* -------------------------------------------------------------------------- */

async function callCatalog(config: AmazonConfig, operation: string, payload: Record<string, unknown>) {
  const token = await accessToken(config);
  const response = await fetch(`${CREATORS_API_HOST}/catalog/v1/${operation}`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      // 2.x credentials carry the version alongside the token; 3.x do not.
      Authorization: config.isLwa ? `Bearer ${token}` : `Bearer ${token}, Version ${config.version}`,
      "Content-Type": "application/json",
      "x-marketplace": config.marketplace,
    },
    body: JSON.stringify({ partnerTag: config.partnerTag, resources: PRODUCT_RESOURCES, ...payload }),
  });

  if (response.status === 401 || response.status === 403) {
    // A rejected token is worth one retry; a stale cached token looks the same
    // as revoked credentials until we try again with a fresh one.
    clearAmazonToken();
    throw new Error(`Amazon catalog request was rejected with status ${response.status}`);
  }
  if (!response.ok) throw new Error(`Amazon catalog request failed with status ${response.status}`);

  const parsed = catalogResponseSchema.safeParse(await response.json());
  if (!parsed.success) return [];
  const items = parsed.data.itemsResult?.items ?? parsed.data.searchResult?.items ?? [];
  return items.map(toProduct).filter((product): product is AmazonProduct => product !== null);
}

/* -------------------------------------------------------------------------- */
/* Caching                                                                    */
/* -------------------------------------------------------------------------- */

function redis() {
  const config = redisConfig();
  return config ? new Redis(config) : null;
}

async function cached(key: string, load: () => Promise<AmazonProduct[]>): Promise<AmazonProduct[]> {
  const client = redis();
  const cacheKey = `${CACHE_PREFIX}:${key}`;

  if (client) {
    const hit = await client.get<unknown>(cacheKey).catch(() => null);
    if (hit) {
      const value = typeof hit === "string" ? JSON.parse(hit) : hit;
      const parsed = z.array(z.custom<AmazonProduct>()).safeParse(value);
      if (parsed.success) return parsed.data;
    }
  } else {
    const hit = memoryCache.get(cacheKey);
    if (hit && Date.now() < hit.expiresAt) return hit.value;
  }

  const products = await load();

  if (client) {
    await client.set(cacheKey, JSON.stringify(products), { ex: PRODUCT_TTL_SECONDS }).catch(() => {});
  } else {
    memoryCache.set(cacheKey, { value: products, expiresAt: Date.now() + PRODUCT_TTL_SECONDS * 1000 });
  }
  return products;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function getItemsByAsin(asins: string[], config: AmazonConfig) {
  if (!asins.length) return [];
  return callCatalog(config, "getItems", { itemIds: asins });
}

export async function searchItems(keywords: string, itemCount: number, config: AmazonConfig) {
  return callCatalog(config, "searchItems", { keywords, itemCount });
}

/**
 * Products for an ad placement, cached and fail-safe.
 *
 * Returns an empty array whenever credentials are missing or Amazon is
 * unreachable, so a banner never takes the page down with it.
 */
export async function getBannerProducts(limit: number): Promise<AmazonProduct[]> {
  const config = amazonConfig();
  if (!config) return [];

  const { asins, keywords } = adSelection();
  const key = asins.length
    ? `${config.marketplace}:asins:${asins.join("-")}`
    : `${config.marketplace}:search:${keywords}:${limit}`;

  try {
    const products = await cached(key, () =>
      asins.length ? getItemsByAsin(asins, config) : searchItems(keywords, limit, config),
    );
    return products.slice(0, limit);
  } catch (error) {
    console.error("Amazon banner fetch failed", error);
    return [];
  }
}
