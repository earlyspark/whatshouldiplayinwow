import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { amazonConfig, partnerTag } from "@/lib/amazon-config";
import { clearAmazonToken, getBannerProducts, getProductPool } from "@/lib/amazon";

const TOKEN_RESPONSE = { access_token: "token-abc", expires_in: 3600 };

const CATALOG_RESPONSE = {
  itemsResult: {
    items: [
      {
        asin: "B0TESTASIN",
        detailPageURL: "https://www.amazon.com/dp/B0TESTASIN?tag=wowforever-20",
        images: { primary: { large: { url: "https://m.media-amazon.com/images/I/test.jpg", width: 500, height: 500 } } },
        itemInfo: { title: { displayValue: "Azeroth Mouse Pad" } },
        offersV2: { listings: [{ price: { money: { displayAmount: "$19.99" } } }] },
      },
    ],
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function stubAmazon(catalog: unknown = CATALOG_RESPONSE, catalogStatus = 200) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/auth/o2/token") || url.includes("amazoncognito.com")) return jsonResponse(TOKEN_RESPONSE);
    if (url.includes("searchItems") && catalog && typeof catalog === "object" && "searchResult" in catalog) {
      const { itemCount, itemPage } = JSON.parse(init?.body as string);
      const result = catalog.searchResult as { items?: unknown[] };
      return jsonResponse({ searchResult: { items: result.items?.slice((itemPage - 1) * itemCount, itemPage * itemCount) ?? [] } }, catalogStatus);
    }
    return jsonResponse(catalog, catalogStatus);
  });
}

beforeEach(() => {
  clearAmazonToken();
  vi.stubEnv("AMAZON_CREATORS_CREDENTIAL_ID", "amzn1.application-oa2-client.test");
  vi.stubEnv("AMAZON_CREATORS_CREDENTIAL_SECRET", "amzn1.oa2-cs.v1.test");
  vi.stubEnv("AMAZON_ASSOCIATE_TAG", "wowforever-20");
  vi.stubEnv("AMAZON_AD_ASINS", "B0TESTASIN");
  // Keep the Redis-backed cache out of the way so tests exercise the API path.
  vi.stubEnv("WOWFOREVER_KV_REST_API_URL", "");
  vi.stubEnv("WOWFOREVER_KV_REST_API_TOKEN", "");
  vi.stubEnv("KV_REST_API_URL", "");
  vi.stubEnv("KV_REST_API_TOKEN", "");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  clearAmazonToken();
});

describe("amazonConfig", () => {
  it("defaults to the 3.1 credential version and the US marketplace", () => {
    const config = amazonConfig();
    expect(config?.version).toBe("3.1");
    expect(config?.marketplace).toBe("www.amazon.com");
    expect(config?.tokenEndpoint).toBe("https://api.amazon.com/auth/o2/token");
    expect(config?.isLwa).toBe(true);
  });

  it("accepts Amazon's v3.1 version label", () => {
    vi.stubEnv("AMAZON_CREATORS_VERSION", "v3.1");
    const config = amazonConfig();
    expect(config?.version).toBe("3.1");
    expect(config?.tokenEndpoint).toBe("https://api.amazon.com/auth/o2/token");
    expect(config?.isLwa).toBe(true);
  });

  it("selects the Cognito token endpoint for 2.x credentials", () => {
    vi.stubEnv("AMAZON_CREATORS_VERSION", "2.1");
    const config = amazonConfig();
    expect(config?.isLwa).toBe(false);
    expect(config?.tokenEndpoint).toBe("https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token");
  });

  it("is unconfigured when credentials or the partner tag are missing", () => {
    vi.stubEnv("AMAZON_CREATORS_CREDENTIAL_SECRET", "");
    expect(amazonConfig()).toBeNull();
  });

  it("treats an unknown credential version as unconfigured", () => {
    vi.stubEnv("AMAZON_CREATORS_VERSION", "9.9");
    expect(amazonConfig()).toBeNull();
  });

  it("falls back to the public associate tag", () => {
    vi.stubEnv("AMAZON_ASSOCIATE_TAG", "");
    vi.stubEnv("NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG", "public-20");
    expect(partnerTag()).toBe("public-20");
  });
});

describe("getBannerProducts", () => {
  it("authenticates, then requests the catalog with the partner tag", async () => {
    const fetchMock = stubAmazon();
    vi.stubGlobal("fetch", fetchMock);

    const products = await getBannerProducts(1);

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(tokenUrl).toBe("https://api.amazon.com/auth/o2/token");
    expect(JSON.parse(tokenInit.body as string)).toMatchObject({
      grant_type: "client_credentials",
      scope: "creatorsapi::default",
    });

    const [catalogUrl, catalogInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(catalogUrl).toBe("https://creatorsapi.amazon/catalog/v1/getItems");
    const headers = catalogInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-abc");
    expect(headers["x-marketplace"]).toBe("www.amazon.com");
    expect(JSON.parse(catalogInit.body as string)).toMatchObject({
      partnerTag: "wowforever-20",
      itemIds: ["B0TESTASIN"],
    });

    expect(products).toEqual([
      {
        asin: "B0TESTASIN",
        title: "Azeroth Mouse Pad",
        url: "https://www.amazon.com/dp/B0TESTASIN?tag=wowforever-20",
        imageUrl: "https://m.media-amazon.com/images/I/test.jpg",
        imageWidth: 500,
        imageHeight: 500,
      },
    ]);
  });

  it("appends the version to the Authorization header for 2.x credentials", async () => {
    vi.stubEnv("AMAZON_CREATORS_VERSION", "2.3");
    const fetchMock = stubAmazon();
    vi.stubGlobal("fetch", fetchMock);

    await getBannerProducts(1);

    const [, tokenInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(tokenInit.headers).toMatchObject({ "Content-Type": "application/x-www-form-urlencoded" });
    expect(tokenInit.body).toContain("scope=creatorsapi%2Fdefault");

    const [, catalogInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect((catalogInit.headers as Record<string, string>).Authorization).toBe("Bearer token-abc, Version 2.3");
  });

  it("searches when no ASINs are configured", async () => {
    vi.stubEnv("AMAZON_AD_ASINS", "");
    vi.stubEnv("AMAZON_AD_KEYWORDS", "warcraft mousepad");
    const fetchMock = stubAmazon({ searchResult: CATALOG_RESPONSE.itemsResult });
    vi.stubGlobal("fetch", fetchMock);

    const products = await getBannerProducts(3);

    const [catalogUrl, catalogInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(catalogUrl).toBe("https://creatorsapi.amazon/catalog/v1/searchItems");
    expect(JSON.parse(catalogInit.body as string)).toMatchObject({ keywords: "warcraft mousepad", itemCount: 10, itemPage: 1 });
    expect(JSON.parse(catalogInit.body as string).resources).not.toContain("offersV2.listings.price");
    expect(products).toHaveLength(1);
  });

  it("reuses the cached bearer token across calls", async () => {
    const fetchMock = stubAmazon();
    vi.stubGlobal("fetch", fetchMock);

    await getBannerProducts(1);
    const tokenCalls = () =>
      fetchMock.mock.calls.filter(([url]) => String(url).includes("/auth/o2/token")).length;
    expect(tokenCalls()).toBe(1);

    // A different placement size skips the product cache but must not re-auth.
    vi.stubEnv("AMAZON_AD_ASINS", "B0OTHERASIN");
    await getBannerProducts(1);
    expect(tokenCalls()).toBe(1);
  });

  it("serves repeat requests from the cache without calling the catalog again", async () => {
    const fetchMock = stubAmazon();
    vi.stubGlobal("fetch", fetchMock);

    await getBannerProducts(1);
    await getBannerProducts(1);

    const catalogCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/catalog/v1/"));
    expect(catalogCalls).toHaveLength(1);
  });

  it("returns nothing when credentials are absent", async () => {
    vi.stubEnv("AMAZON_CREATORS_CREDENTIAL_ID", "");
    const fetchMock = stubAmazon();
    vi.stubGlobal("fetch", fetchMock);

    expect(await getBannerProducts(1)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns nothing when Amazon rejects the request", async () => {
    vi.stubGlobal("fetch", stubAmazon({ message: "denied" }, 403));
    expect(await getBannerProducts(1)).toEqual([]);
  });

  it("cools down after a catalog failure before trying Amazon again", async () => {
    const fetchMock = stubAmazon({ message: "unavailable" }, 503);
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const clock = vi.spyOn(Date, "now");
    const start = 1_800_000_000_000;
    clock.mockReturnValue(start);
    expect(await getProductPool()).toEqual([]);
    expect(await getProductPool()).toEqual([]);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/catalog/v1/"))).toHaveLength(1);
    clock.mockReturnValue(start + 91_000);
    expect(await getProductPool()).toEqual([]);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/catalog/v1/"))).toHaveLength(2);
    clock.mockRestore();
    vi.restoreAllMocks();
  });

  it("shares a simultaneous cache miss within the same server process", async () => {
    const fetchMock = stubAmazon();
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([getProductPool(), getProductPool(), getProductPool()]);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/catalog/v1/"))).toHaveLength(1);
  });

  it("drops items that have no title or link", async () => {
    vi.stubGlobal("fetch", stubAmazon({ itemsResult: { items: [{ asin: "B0NOTITLE" }] } }));
    expect(await getBannerProducts(1)).toEqual([]);
  });
});

function poolResponse(count: number) {
  return {
    searchResult: {
      items: Array.from({ length: count }, (_, index) => ({
        asin: `B0POOL${String(index).padStart(3, "0")}`,
        detailPageURL: `https://www.amazon.com/dp/B0POOL${index}?tag=wowforever-20`,
        itemInfo: { title: { displayValue: `Pool product ${index}` } },
      })),
    },
  };
}

describe("pool and rotation", () => {

  it("varies the rotating slots across renders without new API calls", async () => {
    vi.stubEnv("AMAZON_AD_ASINS", "");
    const fetchMock = stubAmazon(poolResponse(40));
    vi.stubGlobal("fetch", fetchMock);

    const renders = new Set<string>();
    for (let i = 0; i < 12; i += 1) {
      const products = await getBannerProducts(3);
      renders.add(products.map((product) => product.asin).join(","));
    }

    expect(renders.size).toBeGreaterThan(1);

    const catalogCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/catalog/v1/"));
    expect(catalogCalls).toHaveLength(5);
  });

  it("keeps the pool within the requested size", async () => {
    vi.stubEnv("AMAZON_AD_ASINS", "");
    vi.stubEnv("AMAZON_AD_POOL_SIZE", "25");
    const fetchMock = stubAmazon(poolResponse(30));
    vi.stubGlobal("fetch", fetchMock);

    expect(await getProductPool()).toHaveLength(25);
    const searches = fetchMock.mock.calls.filter(([url]) => String(url).includes("searchItems"));
    expect(searches).toHaveLength(3);
    expect(searches.map(([, init]) => JSON.parse((init as RequestInit).body as string))).toEqual([
      expect.objectContaining({ itemCount: 10, itemPage: 1 }),
      expect.objectContaining({ itemCount: 10, itemPage: 2 }),
      expect.objectContaining({ itemCount: 10, itemPage: 3 }),
    ]);
  });

  it("clamps an out-of-range pool size to what searchItems accepts", async () => {
    vi.stubEnv("AMAZON_AD_ASINS", "");
    vi.stubEnv("AMAZON_AD_POOL_SIZE", "500");
    const fetchMock = stubAmazon(poolResponse(100));
    vi.stubGlobal("fetch", fetchMock);

    expect(await getProductPool()).toHaveLength(100);
    const searches = fetchMock.mock.calls.filter(([url]) => String(url).includes("searchItems"));
    expect(searches).toHaveLength(10);
    expect(searches.every(([, init]) => JSON.parse((init as RequestInit).body as string).itemCount === 10)).toBe(true);
  });
});

describe("keyword overrides", () => {
  it("searches the override query instead of the configured pool", async () => {
    vi.stubEnv("AMAZON_AD_KEYWORDS", "World of Warcraft");
    const fetchMock = stubAmazon(poolResponse(10));
    vi.stubGlobal("fetch", fetchMock);

    await getBannerProducts(3, "World of Warcraft Druid");

    const [, catalogInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(JSON.parse(catalogInit.body as string)).toMatchObject({ keywords: "World of Warcraft Druid" });
  });

  it("caches each query separately", async () => {
    vi.stubEnv("AMAZON_AD_ASINS", "");
    const fetchMock = stubAmazon(poolResponse(10));
    vi.stubGlobal("fetch", fetchMock);

    await getProductPool("World of Warcraft Druid");
    await getProductPool("World of Warcraft Mage");
    await getProductPool("World of Warcraft Druid");

    const searches = fetchMock.mock.calls.filter(([url]) => String(url).includes("searchItems"));
    expect(searches).toHaveLength(2);
  });

  it("fills a four-product result sidebar from one class-specific search", async () => {
    vi.stubEnv("AMAZON_AD_ASINS", "B0CURATED1");
    const fetchMock = stubAmazon(poolResponse(20));
    vi.stubGlobal("fetch", fetchMock);

    const products = await getBannerProducts(4, "World of Warcraft Druid");

    expect(products).toHaveLength(4);
    const searches = fetchMock.mock.calls.filter(([url]) => String(url).includes("searchItems"));
    expect(searches).toHaveLength(1);
    expect(JSON.parse((searches[0][1] as RequestInit).body as string)).toMatchObject({
      keywords: "World of Warcraft Druid", itemCount: 10, itemPage: 1,
    });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("getItems"))).toBe(false);
  });

  it("excludes unrelated search hits from result-specific placements", async () => {
    vi.stubEnv("AMAZON_AD_ASINS", "");
    const response = poolResponse(4);
    response.searchResult.items[0].itemInfo.title.displayValue = "WoW Warrior Shirt";
    response.searchResult.items[1].itemInfo.title.displayValue = "World of Warcraft Book";
    response.searchResult.items[2].itemInfo.title.displayValue = "Warrior Gaming Mat";
    response.searchResult.items[3].itemInfo.title.displayValue = "Pandaren Figure";
    vi.stubGlobal("fetch", stubAmazon(response));

    const banner = await getBannerProducts(4, "World of Warcraft Warrior", "Warrior");

    expect(banner.map((product) => product.title).sort()).toEqual(["Warrior Gaming Mat", "WoW Warrior Shirt"]);
  });

  it("does not fetch a former pinned product for result-specific pools", async () => {
    vi.stubEnv("AMAZON_AD_ASINS", "");
    vi.stubEnv("AMAZON_AD_PINNED_ASIN", "B0PINNED01");
    const fetchMock = stubAmazon(poolResponse(8));
    vi.stubGlobal("fetch", fetchMock);

    const products = await getProductPool("World of Warcraft Druid");
    expect(products).toHaveLength(8);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("getItems"))).toHaveLength(0);
  });

  it("prefers an explicit query over a curated ASIN list", async () => {
    vi.stubEnv("AMAZON_AD_ASINS", "B0CURATED1");
    const fetchMock = stubAmazon(poolResponse(10));
    vi.stubGlobal("fetch", fetchMock);

    await getProductPool("World of Warcraft Druid");

    const [catalogUrl] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(catalogUrl).toContain("searchItems");
  });
});
