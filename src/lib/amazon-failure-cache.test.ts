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

it("stores a short shared cooldown after an Amazon failure", async () => {
  vi.stubEnv("WOWFOREVER_KV_REST_API_URL", "https://example.upstash.io");
  vi.stubEnv("WOWFOREVER_KV_REST_API_TOKEN", "test-token");
  vi.stubEnv("AMAZON_CREATORS_CREDENTIAL_ID", "amzn1.application-oa2-client.test");
  vi.stubEnv("AMAZON_CREATORS_CREDENTIAL_SECRET", "amzn1.oa2-cs.v1.test");
  vi.stubEnv("AMAZON_ASSOCIATE_TAG", "test-20");
  vi.stubEnv("AMAZON_AD_ASINS", "B0TESTASIN");
  vi.stubEnv("AMAZON_AD_PINNED_ASIN", "");
  redisCalls.get.mockResolvedValueOnce(null).mockResolvedValueOnce([]);
  redisCalls.set.mockResolvedValue("OK");
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetchMock = vi.fn(async (input: string | URL | Request) =>
    new Response(JSON.stringify(String(input).includes("/auth/o2/token")
      ? { access_token: "token", expires_in: 3600 }
      : { error: "unavailable" }), { status: String(input).includes("/auth/o2/token") ? 200 : 503 }),
  );
  vi.stubGlobal("fetch", fetchMock);

  expect(await getProductPool()).toEqual([]);
  expect(redisCalls.set).toHaveBeenCalledWith(expect.stringContaining(":asins:B0TESTASIN"), "[]", { ex: 90 });
  clearAmazonToken(); // Simulate a fresh process reading the shared Redis cooldown.
  expect(await getProductPool()).toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(2); // One token exchange and one failed catalog call.
});
