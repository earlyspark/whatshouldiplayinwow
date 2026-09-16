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
 * Product identity, titles, images, and links are cached separately. Offer
 * prices are not requested or displayed because they require a shorter TTL.
 */

const TOKEN_EXPIRY_BUFFER_SECONDS = 30;
const DEFAULT_TOKEN_LIFETIME_SECONDS = 3600;
const PRODUCT_TTL_SECONDS = 6 * 60 * 60;
const REQUEST_TIMEOUT_MS = 8000;
const CACHE_PREFIX = "wow-forever-amazon:v2";

const PRODUCT_RESOURCES = [
  "images.primary.large",
  "itemInfo.title",
] as const;

export interface AmazonProduct {
  asin: string;
  title: string;
  /** Affiliate link returned by Amazon, already carrying the partner tag. */
  url: string;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
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

export async function searchItems(keywords: string, itemCount: number, config: AmazonConfig, itemPage = 1) {
  return callCatalog(config, "searchItems", { keywords, itemCount, itemPage });
}

async function searchPool(keywords: string, size: number, config: AmazonConfig) {
  const products = new Map<string, AmazonProduct>();
  const pageSize = Math.min(10, size);
  for (let page = 1; page <= 10 && products.size < size; page += 1) {
    const items = await searchItems(keywords, pageSize, config, page);
    const previousSize = products.size;
    for (const product of items) products.set(product.asin, product);
    if (items.length < pageSize || products.size === previousSize) break;
  }
  return [...products.values()].slice(0, size);
}

/**
 * The pool every placement draws from, cached and fail-safe.
 *
 * One pool is fetched per cache cycle and then sampled per request, which is
 * what lets the page vary products without spending an API call per view. The
 * pinned product is fetched separately for the general quiz pool. Result
 * searches are a separate contextual pool without the generic pinned item.
 *
 * Returns an empty array whenever credentials are missing or Amazon is
 * unreachable, so an ad never takes the page down with it.
 */
export async function getProductPool(overrideKeywords?: string): Promise<AmazonProduct[]> {
  const config = amazonConfig();
  if (!config) return [];

  const { asins: configuredAsins, keywords: defaultKeywords, pinnedAsin, poolSize } = adSelection();
  // An explicit query always means a search, so a curated ASIN list does not
  // silently override a caller asking for something context-specific.
  const asins = overrideKeywords ? [] : configuredAsins;
  const keywords = overrideKeywords ?? defaultKeywords;
  // A contextual result needs only four visible products. Limit each distinct
  // class query to one catalog request so a popular result does not exhaust
  // Amazon's search quota while still leaving products to rotate.
  const searchSize = overrideKeywords ? Math.min(poolSize, 10) : poolSize;
  const poolKey = asins.length
    ? `${config.marketplace}:asins:${asins.join("-")}`
    : `${config.marketplace}:search:${keywords}:${searchSize}`;

  try {
    const [poolResult, pinnedResult] = await Promise.allSettled([
      cached(poolKey, () =>
        asins.length ? getItemsByAsin(asins, config) : searchPool(keywords, searchSize, config),
      ),
      pinnedAsin && !overrideKeywords
        ? cached(`${config.marketplace}:pinned:${pinnedAsin}`, () => getItemsByAsin([pinnedAsin], config))
        : Promise.resolve([]),
    ]);

    if (poolResult.status === "rejected") console.error("Amazon search pool fetch failed", poolResult.reason);
    if (pinnedResult.status === "rejected") console.error("Amazon pinned product fetch failed", pinnedResult.reason);
    const pool = poolResult.status === "fulfilled" ? poolResult.value : [];
    const pinned = pinnedResult.status === "fulfilled" ? pinnedResult.value : [];
    // The pinned product leads and must not also appear further down the list.
    const rest = pool.filter((product) => product.asin !== pinnedAsin);
    return [...pinned, ...rest];
  } catch (error) {
    console.error("Amazon product fetch failed", error);
    return [];
  }
}

/** Whether the first pool entry is the configured evergreen product. */
function hasPinned(pool: AmazonProduct[], keywords?: string) {
  if (keywords) return false;
  const { pinnedAsin } = adSelection();
  return Boolean(pinnedAsin) && pool[0]?.asin === pinnedAsin;
}

/** Stable 32-bit hash, so a given seed always yields the same pick. */
function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/** Fisher-Yates, so every product has an equal chance of a placement. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Products for a banner placement.
 *
 * The pinned product keeps the first slot and the remaining slots are drawn
 * fresh per request, so a repeat visitor does not see the same banner twice.
 * Shuffling happens here on the server; doing it in a client component would
 * desynchronise the markup React hydrates against.
 */
export async function getBannerProducts(limit: number, keywords?: string, focusTerm?: string): Promise<AmazonProduct[]> {
  const pool = await getProductPool(keywords);
  if (!pool.length) return [];
  const relevant = focusTerm
    ? pool.filter((product) => product.title.toLowerCase().includes(focusTerm.toLowerCase()))
    : pool;

  if (!hasPinned(relevant, keywords)) return shuffle(relevant).slice(0, limit);
  const [pinned, ...rest] = relevant;
  return [pinned, ...shuffle(rest).slice(0, Math.max(0, limit - 1))];
}

/**
 * One product for an in-content text link.
 *
 * Deterministic by seed rather than random: this reads as part of the prose,
 * so it must not change between a reload and a revisit of the same permalink.
 * The generic pinned product is skipped when it already has the quiz banner slot.
 */
export async function getContextualProduct(seed: string, keywords?: string, focusTerm?: string): Promise<AmazonProduct | null> {
  const pool = await getProductPool(keywords);
  const candidates = (hasPinned(pool, keywords) ? pool.slice(1) : pool)
    .filter((product) => !focusTerm || product.title.toLowerCase().includes(focusTerm.toLowerCase()));
  if (!candidates.length) return null;
  return candidates[hashSeed(seed) % candidates.length];
}
