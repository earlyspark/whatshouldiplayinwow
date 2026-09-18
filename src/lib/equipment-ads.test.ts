import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CREATOR_BOOK_ASIN, clearAmazonToken, getCreatorBookProduct, getEquipmentGroups, getEquipmentPicks } from "@/lib/amazon";

const titles: Record<string, string> = {
  "stream deck": "Elgato Stream Deck XL Streaming Controller",
  "mmo gaming mouse": "Razer MMO Gaming Mouse 12 Button",
  "mechanical gaming keyboard": "Mechanical Gaming Keyboard",
  "1440p qhd gaming monitor": "1440p QHD Gaming Monitor",
  "usb xlr streaming microphone": "USB XLR Streaming Microphone",
  "4k webcam": "4K Webcam for Streaming",
  "streaming key light": "Streaming Key Light",
  "studio monitor headphones": "Studio Monitor Headphones",
  "ergonomic gaming chair": "Ergonomic Gaming Chair with Lumbar Support",
  "wireless gaming headset": "Wireless Gaming Headset with Mic",
  "large gaming desk mat": "XXL Desk Mat Extended Mouse Pad",
  "wireless pc game controller": "Wireless Game Controller for PC",
  "handheld gaming pc": "ROG Ally Handheld Gaming PC",
  "epic fantasy book box set": "Epic Fantasy Box Set Books 1-5",
  "dungeons & dragons": "Dungeons & Dragons Player's Handbook",
  "cooperative strategy board game": "Cooperative Strategy Board Game",
  "family board game": "Family Board Game for Kids and Adults",
  "miniature painting starter kit": "Miniature Paint Starter Set",
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
  it("searches every category with available new four-star products and price floors", async () => {
    const fetchMock = mockCatalog();
    vi.stubGlobal("fetch", fetchMock);
    const groups = await getEquipmentGroups();
    expect(groups.map((group) => group.products.length)).toEqual(Array(18).fill(1));
    const searches = fetchMock.mock.calls.filter(([url]) => String(url).includes("searchItems"));
    expect(searches).toHaveLength(18);
    expect(searches.map(([, init]) => JSON.parse((init as RequestInit).body as string).minPrice)).toEqual([
      10000, 6000, 10000, 20000, 10000, 12000, 7500, 10000,
      15000, 7000, 2000, 4000, 40000, 3000, 1500, 2500, 2000, 2500,
    ]);
    for (const [, init] of searches) expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      availability: "Available", condition: "New", minReviewsRating: 4, itemCount: 10, sortBy: "Relevance", partnerTag: "test-20",
    });
    expect(groups[0].products[0].url).toContain("tag=test-20");
  });

  it("picks the requested number of distinct categories", async () => {
    vi.stubGlobal("fetch", mockCatalog());
    const picks = await getEquipmentPicks(4);
    expect(picks).toHaveLength(4);
    expect(new Set(picks.map((pick) => pick.category)).size).toBe(4);
  });

  it("retries a throttled search instead of leaving the category empty", async () => {
    const catalog = mockCatalog();
    let throttled = false;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (!throttled && String(input).includes("searchItems")) {
        throttled = true;
        return new Response("", { status: 429 });
      }
      return catalog(input, init);
    });
    vi.stubGlobal("fetch", fetchMock);
    const groups = await getEquipmentGroups();
    expect(groups[0].products).toHaveLength(1);
  });

  it("keeps desk mats even though their titles mention mouse pads", async () => {
    vi.stubGlobal("fetch", mockCatalog());
    const groups = await getEquipmentGroups();
    expect(groups.find((group) => group.category === "desk-mat")?.products).toHaveLength(1);
  });

  it("omits accessories, unrelated products, duplicates, and the creator book", async () => {
    vi.stubGlobal("fetch", mockCatalog((keywords) => {
      if (keywords.includes("stream deck")) return [item("DUPLICATE", "Stream Deck Controller"), item("CASE", "Stream Deck Case")];
      if (keywords.includes("mmo gaming mouse")) return [item("DUPLICATE", "MMO Gaming Mouse"), item("MOUSE", "MMO Gaming Mouse")];
      if (keywords.includes("mechanical gaming keyboard")) return [item(CREATOR_BOOK_ASIN, "Mechanical Keyboard"), item("UNRELATED", "Fantasy Novel")];
      return [];
    }));
    const groups = await getEquipmentGroups();
    expect(groups.slice(0, 4).map((group) => group.products.map((product) => product.asin))).toEqual([["DUPLICATE"], ["MOUSE"], [], []]);
  });

  it("caches each category for six hours", async () => {
    const fetchMock = mockCatalog();
    vi.stubGlobal("fetch", fetchMock);
    const clock = vi.spyOn(Date, "now");
    const start = 1_800_000_000_000;
    clock.mockReturnValue(start);
    await getEquipmentGroups();
    clock.mockReturnValue(start + 6 * 60 * 60 * 1000 - 1);
    await getEquipmentGroups();
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("searchItems"))).toHaveLength(18);
    clock.mockReturnValue(start + 6 * 60 * 60 * 1000 + 1);
    await getEquipmentGroups();
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("searchItems"))).toHaveLength(36);
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
    expect((await getEquipmentGroups()).map((group) => group.products)).toEqual(Array(18).fill([]));
    expect(await getCreatorBookProduct()).toBeNull();
    vi.restoreAllMocks();
  });
});
