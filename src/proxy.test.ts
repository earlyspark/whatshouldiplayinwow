import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

afterEach(() => vi.unstubAllEnvs());

describe("private stats page", () => {
  it("fails closed when the password is not configured", () => {
    vi.stubEnv("STATS_PASSWORD", "");
    expect(proxy(new NextRequest("https://example.com/stats")).status).toBe(503);
  });

  it("requires valid credentials and excludes responses from indexing", () => {
    vi.stubEnv("STATS_PASSWORD", "a-long-private-password");
    const unauthorized = proxy(new NextRequest("https://example.com/stats"));
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get("www-authenticate")).toContain("Basic");

    const authorization = `Basic ${Buffer.from("admin:a-long-private-password").toString("base64")}`;
    const authorized = proxy(new NextRequest("https://example.com/stats", { headers: { authorization } }));
    expect(authorized.status).toBe(200);
    expect(authorized.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});
