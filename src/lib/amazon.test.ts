import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { amazonConfig, partnerTag } from "@/lib/amazon-config";
import { clearAmazonToken, getBannerProducts } from "@/lib/amazon";

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

/** Answers the token endpoint and the catalog endpoint from one stub. */
function stubAmazon(catalog: unknown = CATALOG_RESPONSE, catalogStatus = 200) {
  return vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/auth/o2/token") || url.includes("amazoncognito.com")) return jsonResponse(TOKEN_RESPONSE);
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
        price: "$19.99",
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
    expect(JSON.parse(catalogInit.body as string)).toMatchObject({ keywords: "warcraft mousepad", itemCount: 3 });
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

  it("drops items that have no title or link", async () => {
    vi.stubGlobal("fetch", stubAmazon({ itemsResult: { items: [{ asin: "B0NOTITLE" }] } }));
    expect(await getBannerProducts(1)).toEqual([]);
  });
});
