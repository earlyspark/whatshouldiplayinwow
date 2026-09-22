import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocked = vi.hoisted(() => ({
  redis: true,
  failuresLimit: vi.fn(),
  failuresRemaining: vi.fn(),
  retiredLimit: vi.fn(),
}));

vi.mock("@/lib/redis-config", () => ({ redisConfig: () => (mocked.redis ? { url: "https://example.invalid", token: "test" } : null) }));
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() { return {}; }
    static fixedWindow() { return {}; }
    private retired: boolean;
    constructor({ prefix }: { prefix: string }) { this.retired = prefix.endsWith("retired"); }
    limit = (ip: string) => (this.retired ? mocked.retiredLimit(ip) : mocked.failuresLimit(ip));
    getRemaining = (ip: string) => mocked.failuresRemaining(ip);
  },
}));

import { proxy } from "@/proxy";

const request = (credentials?: string, ip = "203.0.113.7") => new NextRequest("https://example.com/stats", {
  headers: {
    "cf-connecting-ip": ip,
    ...(credentials ? { authorization: `Basic ${Buffer.from(credentials).toString("base64")}` } : {}),
  },
});

beforeEach(() => {
  vi.stubEnv("APP_ENV", "production");
  vi.stubEnv("STATS_USERNAME", "stats-keeper");
  vi.stubEnv("STATS_PASSWORD", "a-long-private-password");
  mocked.redis = true;
  mocked.failuresRemaining.mockResolvedValue({ remaining: 5, reset: Date.now() + 3_600_000 });
  mocked.failuresLimit.mockResolvedValue({ success: true, reset: Date.now() + 3_600_000 });
  mocked.retiredLimit.mockResolvedValue({ success: true, reset: Date.now() + 86_400_000 });
});

afterEach(() => {
  vi.unstubAllEnvs();
  mocked.failuresLimit.mockReset();
  mocked.failuresRemaining.mockReset();
  mocked.retiredLimit.mockReset();
});

describe("private stats page", () => {
  it("fails closed when the username or password is not configured", async () => {
    vi.stubEnv("STATS_USERNAME", "");
    expect((await proxy(request("stats-keeper:a-long-private-password"))).status).toBe(503);
    vi.stubEnv("STATS_USERNAME", "stats-keeper");
    vi.stubEnv("STATS_PASSWORD", "");
    expect((await proxy(request("stats-keeper:a-long-private-password"))).status).toBe(503);
  });

  it("prompts for credentials without counting the prompt as an attempt", async () => {
    const response = await proxy(request());
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("Basic");
    expect(mocked.failuresLimit).not.toHaveBeenCalled();
  });

  it("admits the configured credentials and excludes responses from indexing", async () => {
    const response = await proxy(request("stats-keeper:a-long-private-password"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocked.failuresLimit).not.toHaveBeenCalled();
  });

  it("counts a wrong username or password as a failed attempt", async () => {
    expect((await proxy(request("stats-keeper:wrong"))).status).toBe(401);
    expect((await proxy(request("someone:a-long-private-password"))).status).toBe(401);
    expect(mocked.failuresLimit).toHaveBeenCalledTimes(2);
    expect(mocked.failuresLimit).toHaveBeenCalledWith("203.0.113.7");
  });

  it("locks out an address after too many failures, even with the right credentials", async () => {
    mocked.failuresRemaining.mockResolvedValue({ remaining: 0, reset: Date.now() + 600_000 });
    const response = await proxy(request("stats-keeper:a-long-private-password"));
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("never admits the retired username and allows one try per day", async () => {
    const first = await proxy(request("admin:a-long-private-password"));
    expect(first.status).toBe(401);
    expect(mocked.retiredLimit).toHaveBeenCalledWith("203.0.113.7");
    expect(mocked.failuresLimit).toHaveBeenCalledWith("203.0.113.7");

    mocked.retiredLimit.mockResolvedValue({ success: false, reset: Date.now() + 86_000_000 });
    const second = await proxy(request("admin:a-long-private-password"));
    expect(second.status).toBe(429);
    expect(Number(second.headers.get("retry-after"))).toBeGreaterThan(80_000);
  });

  it("still checks credentials when rate limiting is unavailable", async () => {
    mocked.redis = false;
    expect((await proxy(request("admin:a-long-private-password"))).status).toBe(401);
    expect((await proxy(request("stats-keeper:a-long-private-password"))).status).toBe(200);
    expect(mocked.failuresRemaining).not.toHaveBeenCalled();
  });

  it("skips rate limiting in local development", async () => {
    vi.stubEnv("APP_ENV", "development");
    expect((await proxy(request("stats-keeper:wrong"))).status).toBe(401);
    expect(mocked.failuresLimit).not.toHaveBeenCalled();
  });
});
