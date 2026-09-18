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

const TOKEN_EXPIRY_BUFFER_SECONDS = 30;
const DEFAULT_TOKEN_LIFETIME_SECONDS = 3600;
const PRODUCT_TTL_SECONDS = 6 * 60 * 60;
const FAILURE_TTL_SECONDS = 90;
const REQUEST_TIMEOUT_MS = 8000;
const CACHE_PREFIX = "wow-forever-amazon:v3";
export const CREATOR_BOOK_ASIN = "B0HGNX657R";

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

export type EquipmentCategory =
  | "stream-controller" | "mmo-mouse" | "mechanical-keyboard" | "1440p-monitor"
  | "microphone" | "4k-webcam" | "key-light" | "studio-headphones"
  | "gaming-chair" | "gaming-headset" | "desk-mat" | "game-controller" | "handheld-pc"
  | "fantasy-books" | "tabletop-rpg" | "coop-board-game" | "family-board-game" | "miniature-painting";

export interface EquipmentGroup {
  category: EquipmentCategory;
  products: AmazonProduct[];
}

interface EquipmentProfile {
  category: EquipmentCategory;
  keywords: string;
  searchIndex: string;
  /** Amazon price floor in cents. */
  minPrice: number;
  include: RegExp;
  exclude?: RegExp;
}

// Categories whose real products routinely mention pads or cables in the title get a narrower exclusion.
const BASIC_EXCLUDE = /\b(?:replacement|spare|discontinued|no longer supported|renewed|refurbished)\b/i;

const EQUIPMENT: EquipmentProfile[] = [
  { category: "stream-controller", keywords: "Elgato Stream Deck streaming controller", searchIndex: "Electronics", minPrice: 10000, include: /stream deck|stream controller|streaming controller/i },
  { category: "mmo-mouse", keywords: "MMO gaming mouse 12 buttons", searchIndex: "Electronics", minPrice: 6000, include: /mmo.*mouse|mouse.*mmo|12.button.*mouse|mouse.*12.button/i },
  { category: "mechanical-keyboard", keywords: "mechanical gaming keyboard", searchIndex: "Computers", minPrice: 10000, include: /mechanical.*keyboard|keyboard.*mechanical/i },
  { category: "1440p-monitor", keywords: "1440p QHD gaming monitor", searchIndex: "Electronics", minPrice: 20000, include: /(?:1440p|qhd|2560.?x.?1440|wqhd).*monitor|monitor.*(?:1440p|qhd|2560.?x.?1440|wqhd)/i },
  { category: "microphone", keywords: "USB XLR streaming microphone", searchIndex: "Electronics", minPrice: 10000, include: /microphone|\bmic\b/i },
  { category: "4k-webcam", keywords: "4K webcam streaming", searchIndex: "Electronics", minPrice: 12000, include: /(?:4k|uhd|2160p).*webcam|webcam.*(?:4k|uhd|2160p)/i },
  { category: "key-light", keywords: "streaming key light video", searchIndex: "Electronics", minPrice: 7500, include: /key light|video light|studio light|streaming light/i },
  { category: "studio-headphones", keywords: "studio monitor headphones", searchIndex: "Electronics", minPrice: 10000, include: /(?:studio|monitor|reference).*headphones|headphones.*(?:studio|monitor|reference)/i },
  { category: "gaming-chair", keywords: "ergonomic gaming chair lumbar support", searchIndex: "OfficeProducts", minPrice: 15000, include: /chair/i },
  { category: "gaming-headset", keywords: "wireless gaming headset with microphone", searchIndex: "Electronics", minPrice: 7000, include: /headset/i, exclude: BASIC_EXCLUDE },
  { category: "desk-mat", keywords: "large gaming desk mat extended mouse pad", searchIndex: "Computers", minPrice: 2000, include: /desk (?:mat|pad)|mouse ?pad|mousepad/i, exclude: BASIC_EXCLUDE },
  { category: "game-controller", keywords: "wireless PC game controller", searchIndex: "VideoGames", minPrice: 4000, include: /controller|gamepad/i, exclude: BASIC_EXCLUDE },
  { category: "handheld-pc", keywords: "handheld gaming PC", searchIndex: "VideoGames", minPrice: 40000, include: /handheld|rog ally|legion go|steam deck/i },
  { category: "fantasy-books", keywords: "epic fantasy book box set", searchIndex: "Books", minPrice: 3000, include: /box(?:ed)? set|collection|books? \d/i },
  { category: "tabletop-rpg", keywords: "Dungeons & Dragons", searchIndex: "Books", minPrice: 1500, include: /dungeons ?(?:&|and) ?dragons|d&d/i },
  { category: "coop-board-game", keywords: "cooperative strategy board game", searchIndex: "ToysAndGames", minPrice: 2500, include: /board game|cooperative|co-op/i },
  { category: "family-board-game", keywords: "family board game for kids and adults", searchIndex: "ToysAndGames", minPrice: 2000, include: /game/i },
  { category: "miniature-painting", keywords: "miniature painting starter kit", searchIndex: "ToysAndGames", minPrice: 2500, include: /(?:miniature|mini|wargam).*paint|paint.*(?:miniature|mini|wargam)/i },
];

const ACCESSORY_ONLY = /\b(?:case|cover|skin|mount|holder|adapter|cable|replacement|spare|keycaps?|mouse ?pad|boom arm|pop filter|shock mount|light bulb|diffuser|battery|charger|bundle of accessories|stand for|discontinued|no longer supported|renewed|refurbished)\b/i;

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
const inFlight = new Map<string, Promise<AmazonProduct[]>>();
if (process.env.NODE_ENV !== "production") globalThis.__amazonProducts = memoryCache;

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

export function clearAmazonToken() {
  globalThis.__amazonToken = undefined;
  memoryCache.clear();
}

// Amazon throttles bursts of searches (such as every category expiring together) with 429s.
const THROTTLE_RETRY_DELAYS_MS = [1000, 2000];

async function callCatalog(config: AmazonConfig, operation: string, payload: Record<string, unknown>) {
  for (const delay of THROTTLE_RETRY_DELAYS_MS) {
    const response = await requestCatalog(config, operation, payload);
    if (response.status !== 429) return readCatalog(response);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return readCatalog(await requestCatalog(config, operation, payload));
}

async function requestCatalog(config: AmazonConfig, operation: string, payload: Record<string, unknown>) {
  const token = await accessToken(config);
  return fetch(`${CREATORS_API_HOST}/catalog/v1/${operation}`, {
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
}

async function readCatalog(response: Response) {
  if (response.status === 401 || response.status === 403) {
    clearAmazonToken();
    throw new Error(`Amazon catalog request was rejected with status ${response.status}`);
  }
  if (!response.ok) throw new Error(`Amazon catalog request failed with status ${response.status}`);

  const parsed = catalogResponseSchema.safeParse(await response.json());
  if (!parsed.success) return [];
  const items = parsed.data.itemsResult?.items ?? parsed.data.searchResult?.items ?? [];
  return items.map(toProduct).filter((product): product is AmazonProduct => product !== null);
}

function redis() {
  const config = redisConfig();
  return config ? new Redis(config) : null;
}

const cachedProductsSchema = z.object({
  products: z.array(z.custom<AmazonProduct>()),
  expiresAt: z.number(),
});

async function cached(key: string, load: () => Promise<AmazonProduct[]>): Promise<AmazonProduct[]> {
  const client = redis();
  const cacheKey = `${CACHE_PREFIX}:${key}`;
  const local = memoryCache.get(cacheKey);
  if (local && Date.now() < local.expiresAt) return local.value;

  if (client) {
    const hit = await client.get<unknown>(cacheKey).catch(() => null);
    try {
      if (hit) {
        const value = typeof hit === "string" ? JSON.parse(hit) : hit;
        const parsed = cachedProductsSchema.safeParse(value);
        if (parsed.success && parsed.data.expiresAt > Date.now()) {
          // Keep the shared entry in process memory so later renders skip Redis until it expires.
          memoryCache.set(cacheKey, { value: parsed.data.products, expiresAt: parsed.data.expiresAt });
          return parsed.data.products;
        }
      }
    } catch {}
  }

  const pending = inFlight.get(cacheKey);
  if (pending) return pending;
  const request = (async () => {
    let products: AmazonProduct[];
    let ttl = PRODUCT_TTL_SECONDS;
    try {
      products = await load();
    } catch (error) {
      console.error("Amazon catalog fetch failed", error);
      products = [];
      ttl = FAILURE_TTL_SECONDS;
    }
    const expiresAt = Date.now() + ttl * 1000;
    memoryCache.set(cacheKey, { value: products, expiresAt });
    if (client) await client.set(cacheKey, JSON.stringify({ products, expiresAt }), { ex: ttl }).catch(() => {});
    return products;
  })();
  inFlight.set(cacheKey, request);
  try { return await request; }
  finally { inFlight.delete(cacheKey); }
}

export async function getItemsByAsin(asins: string[], config: AmazonConfig) {
  if (!asins.length) return [];
  return callCatalog(config, "getItems", { itemIds: asins });
}

export async function searchItems(keywords: string, itemCount: number, config: AmazonConfig, itemPage = 1) {
  return callCatalog(config, "searchItems", { keywords, itemCount, itemPage });
}

/** Each category is cached independently; sequential misses respect Amazon's request quota. */
export async function getEquipmentGroups(): Promise<EquipmentGroup[]> {
  const config = amazonConfig();
  if (!config) return EQUIPMENT.map(({ category }) => ({ category, products: [] }));

  const seen = new Set<string>([CREATOR_BOOK_ASIN]);
  const groups: EquipmentGroup[] = [];
  for (const profile of EQUIPMENT) {
    const key = `${config.marketplace}:equipment:v1:${profile.category}:${profile.minPrice}`;
    const candidates = await cached(key, () => callCatalog(config, "searchItems", {
      keywords: profile.keywords,
      searchIndex: profile.searchIndex,
      itemCount: 10,
      itemPage: 1,
      availability: "Available",
      condition: "New",
      minReviewsRating: 4,
      minPrice: profile.minPrice,
      sortBy: "Relevance",
    }));
    const products = candidates.filter((product) =>
      Boolean(product.imageUrl) && profile.include.test(product.title) &&
      !(profile.exclude ?? ACCESSORY_ONLY).test(product.title) && !seen.has(product.asin),
    );
    for (const product of products) seen.add(product.asin);
    groups.push({ category: profile.category, products });
  }
  return groups;
}

/** Random categories with one random product each, picked on the server for each render. */
export async function getEquipmentPicks(count: number) {
  const groups = (await getEquipmentGroups()).filter((group) => group.products.length);
  return shuffle(groups).slice(0, count).map((group) => ({
    ...group.products[Math.floor(Math.random() * group.products.length)],
    category: group.category,
  }));
}

export async function getCreatorBookProduct(): Promise<AmazonProduct | null> {
  const config = amazonConfig();
  if (!config) return null;
  const products = await cached(`${config.marketplace}:creator-book:${CREATOR_BOOK_ASIN}`, () => getItemsByAsin([CREATOR_BOOK_ASIN], config));
  return products.find((product) => product.asin === CREATOR_BOOK_ASIN) ?? null;
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

/** Returns [] whenever credentials are missing or Amazon fails, so an ad never breaks the page. */
export async function getProductPool(overrideKeywords?: string): Promise<AmazonProduct[]> {
  const config = amazonConfig();
  if (!config) return [];

  const { asins: configuredAsins, keywords: defaultKeywords, poolSize } = adSelection();
  const asins = overrideKeywords ? [] : configuredAsins;
  const keywords = overrideKeywords ?? defaultKeywords;
  // One catalog request per class query, to spare Amazon's search quota.
  const searchSize = overrideKeywords ? Math.min(poolSize, 10) : poolSize;
  const poolKey = asins.length
    ? `${config.marketplace}:asins:${asins.join("-")}`
    : `${config.marketplace}:search:${keywords}:${searchSize}`;

  try {
    return await cached(poolKey, () =>
      asins.length ? getItemsByAsin(asins, config) : searchPool(keywords, searchSize, config),
    );
  } catch (error) {
    console.error("Amazon product fetch failed", error);
    return [];
  }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Shuffled on the server; shuffling in a client component would break hydration. */
export async function getBannerProducts(limit: number, keywords?: string, focusTerm?: string): Promise<AmazonProduct[]> {
  const pool = await getProductPool(keywords);
  if (!pool.length) return [];
  const relevant = focusTerm
    ? pool.filter((product) => product.title.toLowerCase().includes(focusTerm.toLowerCase()))
    : pool;

  return shuffle(relevant).slice(0, limit);
}

