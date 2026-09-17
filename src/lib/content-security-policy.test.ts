import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "@/lib/content-security-policy";

describe("Content Security Policy", () => {
  it("restricts active resources and supports the required providers", () => {
    const policy = contentSecurityPolicy(false);
    expect(policy).toContain("script-src 'self' 'unsafe-inline' https://www.googletagmanager.com");
    expect(policy).toContain("https://pagead2.googlesyndication.com");
    expect(policy).toContain("frame-src https://*.googlesyndication.com");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("connect-src 'self' https://www.google-analytics.com");
    expect(policy).toContain("https://nether.wowhead.com");
    expect(policy).toContain("https://m.media-amazon.com");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toContain("*;");
  });

  it("permits the development evaluator only in development", () => {
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
  });
});
