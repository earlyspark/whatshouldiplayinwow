import { afterEach, describe, expect, it, vi } from "vitest";
import { errorRouteGroup, prepareGtag, trackEvent, trackPageError, trackPageView } from "@/lib/gtag";

afterEach(() => vi.unstubAllGlobals());

describe("Google tag queue", () => {
  it("queues commands in the Arguments format Google tag processes", () => {
    const browser = { dataLayer: [] as unknown[], gtag: undefined as Window["gtag"], location: { href: "https://example.com/" } };
    vi.stubGlobal("window", browser);

    prepareGtag();
    trackEvent("quiz_start", { quiz_version: "1.14.0" });

    expect(Object.prototype.toString.call(browser.dataLayer[0])).toBe("[object Arguments]");
    expect(Array.from(browser.dataLayer[0] as IArguments)).toEqual([
      "event", "quiz_start", expect.objectContaining({ quiz_version: "1.14.0", page_location: "https://example.com/" }),
    ]);
  });

  it("queues page views without exposing result IDs", () => {
    const browser = { dataLayer: [] as unknown[], gtag: undefined as Window["gtag"], location: { href: "https://example.com/result/ABCDEFGHIJKL?share=secret" } };
    vi.stubGlobal("window", browser);
    vi.stubGlobal("document", { title: "Result" });

    prepareGtag();
    trackPageView("G-TEST", "/result/ABCDEFGHIJKL");

    expect(Array.from(browser.dataLayer[0] as IArguments)).toEqual([
      "event", "page_view", expect.objectContaining({
        send_to: "G-TEST", page_path: "/result/[id]", page_location: "https://example.com/result/[id]", page_title: "Result",
      }),
    ]);
  });

  it("groups error events without leaking result IDs, unknown paths, or query strings", () => {
    const browser = {
      dataLayer: [] as unknown[],
      gtag: undefined as Window["gtag"],
      location: { pathname: "/result/ABCDEFGHIJKL", origin: "https://example.com", href: "https://example.com/result/ABCDEFGHIJKL?receipt=secret" },
    };
    vi.stubGlobal("window", browser);
    prepareGtag();
    trackPageError("G-TEST", "render_error");

    const event = Array.from(browser.dataLayer[0] as IArguments);
    expect(event).toEqual(["event", "page_error", expect.objectContaining({
      send_to: "G-TEST",
      error_type: "render_error",
      page_path: "/result/[id]",
      page_location: "https://example.com/result/[id]",
    })]);
    expect(JSON.stringify(event)).not.toMatch(/ABCDEFGHIJKL|secret/);
    expect(errorRouteGroup("/private/email@example.com")).toBe("/other");
    expect(errorRouteGroup("/pairings")).toBe("/pairings");
    expect(errorRouteGroup("/pairings/protection-warrior")).toBe("/pairings/[spec]");
  });
});
