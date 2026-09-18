import { afterEach, expect, it, vi } from "vitest";

const redisCalls = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));
vi.mock("@upstash/redis", () => ({ Redis: class {
  get = redisCalls.get;
  set = redisCalls.set;
} }));

import { clearAmazonToken, getProductPool } from "@/lib/amazon";

afterEach(() => {
  clearAmazonToken();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  redisCalls.get.mockReset();
  redisCalls.set.mockReset();
});

function stubAmazonEnv() {
  vi.stubEnv("WOWFOREVER_KV_REST_API_URL", "https://example.upstash.io");
  vi.stubEnv("WOWFOREVER_KV_REST_API_TOKEN", "test-token");
  vi.stubEnv("AMAZON_CREATORS_CREDENTIAL_ID", "amzn1.application-oa2-client.test");
  vi.stubEnv("AMAZON_CREATORS_CREDENTIAL_SECRET", "amzn1.oa2-cs.v1.test");
  vi.stubEnv("AMAZON_ASSOCIATE_TAG", "test-20");
  vi.stubEnv("AMAZON_AD_ASINS", "B0TESTASIN");
  vi.stubEnv("AMAZON_AD_PINNED_ASIN", "");
}

it("stores a short shared cooldown after an Amazon failure", async () => {
  stubAmazonEnv();
  redisCalls.get.mockResolvedValueOnce(null).mockResolvedValueOnce({ products: [], expiresAt: Date.now() + 90_000 });
  redisCalls.set.mockResolvedValue("OK");
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetchMock = vi.fn(async (input: string | URL | Request) =>
    new Response(JSON.stringify(String(input).includes("/auth/o2/token")
      ? { access_token: "token", expires_in: 3600 }
      : { error: "unavailable" }), { status: String(input).includes("/auth/o2/token") ? 200 : 503 }),
  );
  vi.stubGlobal("fetch", fetchMock);

  expect(await getProductPool()).toEqual([]);
  expect(redisCalls.set).toHaveBeenCalledWith(expect.stringContaining(":asins:B0TESTASIN"), expect.stringContaining('"products":[]'), { ex: 90 });
  clearAmazonToken();
  expect(await getProductPool()).toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("serves a shared Redis entry from memory until it expires", async () => {
  stubAmazonEnv();
  const product = { asin: "B0TESTASIN", title: "Test", url: "https://amazon.test/p", imageUrl: null, imageWidth: null, imageHeight: null };
  const start = Date.now();
  const clock = vi.spyOn(Date, "now").mockReturnValue(start);
  redisCalls.get
    .mockResolvedValueOnce({ products: [product], expiresAt: start + 60_000 })
    .mockResolvedValueOnce({ products: [product], expiresAt: start + 120_000 });
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  expect(await getProductPool()).toEqual([product]);
  expect(await getProductPool()).toEqual([product]);
  expect(redisCalls.get).toHaveBeenCalledTimes(1);

  clock.mockReturnValue(start + 60_000);
  expect(await getProductPool()).toEqual([product]);
  expect(redisCalls.get).toHaveBeenCalledTimes(2);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("ignores a shared Redis entry that has already expired", async () => {
  stubAmazonEnv();
  redisCalls.get.mockResolvedValue({ products: [], expiresAt: Date.now() - 1 });
  redisCalls.set.mockResolvedValue("OK");
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetchMock = vi.fn(async () => new Response("{}", { status: 503 }));
  vi.stubGlobal("fetch", fetchMock);

  await getProductPool();
  expect(fetchMock).toHaveBeenCalled();
});
