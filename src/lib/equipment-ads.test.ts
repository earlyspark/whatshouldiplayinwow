import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CREATOR_BOOK_ASIN, clearAmazonToken, getCreatorBookProduct, getEquipmentGroups } from "@/lib/amazon";

const titles: Record<string, string> = {
  "stream deck": "Elgato Stream Deck XL Streaming Controller",
  "mmo gaming mouse": "Razer MMO Gaming Mouse 12 Button",
  "mechanical gaming keyboard": "Mechanical Gaming Keyboard",
  "1440p qhd gaming monitor": "1440p QHD Gaming Monitor",
  "usb xlr streaming microphone": "USB XLR Streaming Microphone",
  "4k webcam": "4K Webcam for Streaming",
  "streaming key light": "Streaming Key Light",
  "studio monitor headphones": "Studio Monitor Headphones",
};

const item = (asin: string, title: string) => ({
  asin, detailPageURL: `https://www.amazon.com/dp/${asin}?tag=test-20`,
  images: { primary: { large: { url: `https://m.media-amazon.com/${asin}.jpg` } } },
  itemInfo: { title: { displayValue: title } },
});

function mockCatalog(extra?: (keywords: string) => ReturnType<typeof item>[]) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/auth/o2/token")) return Response.json({ access_token: "token", expires_in: 3600 });
    if (url.includes("getItems")) return Response.json({ itemsResult: { items: [item(CREATOR_BOOK_ASIN, "Children's Book")] } });
    const body = JSON.parse(init?.body as string);
    const keyword = String(body.keywords).toLowerCase();
    const title = Object.entries(titles).find(([key]) => keyword.includes(key))?.[1];
    return Response.json({ searchResult: { items: extra?.(keyword) ?? (title ? [item(keyword.slice(0, 10), title)] : []) } });
  });
}

beforeEach(() => {
  clearAmazonToken();
  vi.stubEnv("AMAZON_CREATORS_CREDENTIAL_ID", "id");
  vi.stubEnv("AMAZON_CREATORS_CREDENTIAL_SECRET", "secret");
  vi.stubEnv("AMAZON_ASSOCIATE_TAG", "test-20");
  vi.stubEnv("WOWFOREVER_KV_REST_API_URL", "");
  vi.stubEnv("KV_REST_API_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
});

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); clearAmazonToken(); });

describe("equipment catalog", () => {
  it("searches four different categories per page with available new four-star products and price floors", async () => {
    const fetchMock = mockCatalog();
    vi.stubGlobal("fetch", fetchMock);
    const homepage = await getEquipmentGroups("homepage");
    const results = await getEquipmentGroups("results");
    expect(homepage.map((group) => group.products.length)).toEqual([1, 1, 1, 1]);
    expect(results.map((group) => group.products.length)).toEqual([1, 1, 1, 1]);
    const searches = fetchMock.mock.calls.filter(([url]) => String(url).includes("searchItems"));
    expect(searches).toHaveLength(8);
    expect(searches.map(([, init]) => JSON.parse((init as RequestInit).body as string).minPrice)).toEqual([10000, 6000, 10000, 20000, 10000, 12000, 7500, 10000]);
    for (const [, init] of searches) expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      availability: "Available", condition: "New", minReviewsRating: 4, itemCount: 10, sortBy: "Relevance", partnerTag: "test-20",
    });
    expect(homepage[0].products[0].url).toContain("tag=test-20");
  });

  it("omits accessories, unrelated products, duplicates, and the creator book", async () => {
    vi.stubGlobal("fetch", mockCatalog((keywords) => {
      if (keywords.includes("stream deck")) return [item("DUPLICATE", "Stream Deck Controller"), item("CASE", "Stream Deck Case")];
      if (keywords.includes("mmo gaming mouse")) return [item("DUPLICATE", "MMO Gaming Mouse"), item("MOUSE", "MMO Gaming Mouse")];
      if (keywords.includes("mechanical gaming keyboard")) return [item(CREATOR_BOOK_ASIN, "Mechanical Keyboard"), item("UNRELATED", "Fantasy Novel")];
      return [];
    }));
    const groups = await getEquipmentGroups("homepage");
    expect(groups.map((group) => group.products.map((product) => product.asin))).toEqual([["DUPLICATE"], ["MOUSE"], [], []]);
  });

  it("caches each category for six hours", async () => {
    const fetchMock = mockCatalog();
    vi.stubGlobal("fetch", fetchMock);
    const clock = vi.spyOn(Date, "now");
    const start = 1_800_000_000_000;
    clock.mockReturnValue(start);
    await getEquipmentGroups("results");
    clock.mockReturnValue(start + 6 * 60 * 60 * 1000 - 1);
    await getEquipmentGroups("results");
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("searchItems"))).toHaveLength(4);
    clock.mockReturnValue(start + 6 * 60 * 60 * 1000 + 1);
    await getEquipmentGroups("results");
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("searchItems"))).toHaveLength(8);
    clock.mockRestore();
  });

  it("loads the book by ASIN separately and preserves its Amazon image, title and affiliate URL", async () => {
    const fetchMock = mockCatalog();
    vi.stubGlobal("fetch", fetchMock);
    const book = await getCreatorBookProduct();
    expect(book).toMatchObject({ asin: CREATOR_BOOK_ASIN, title: "Children's Book", url: expect.stringContaining("tag=test-20"), imageUrl: expect.stringContaining("m.media-amazon.com") });
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("getItems"))).toHaveLength(1);
  });

  it("leaves failed categories and an unavailable book empty", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).includes("/auth/o2/token")) return Response.json({ access_token: "token", expires_in: 3600 });
      if (String(input).includes("getItems")) return Response.json({ itemsResult: { items: [] } });
      const body = JSON.parse(init?.body as string);
      if (String(body.keywords).includes("Stream Deck")) return new Response("", { status: 503 });
      return Response.json({ searchResult: { items: [] } });
    }));
    expect((await getEquipmentGroups("homepage")).map((group) => group.products)).toEqual([[], [], [], []]);
    expect(await getCreatorBookProduct()).toBeNull();
    vi.restoreAllMocks();
  });
});
