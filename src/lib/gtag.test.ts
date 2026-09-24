import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorRouteGroup, prepareGtag, trackEvent, trackPageError, trackPageView } from "@/lib/gtag";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

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
    trackPageView("G-TEST");

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

  describe("page views while a streamed title is pending", () => {
    let browser: { dataLayer: unknown[]; gtag: Window["gtag"]; location: { href: string }; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
    let page: { title: string; documentElement: object };
    let onMutation: () => void;
    const pageViews = () => browser.dataLayer.map((entry) => Array.from(entry as IArguments)).filter((entry) => entry[1] === "page_view");

    beforeEach(() => {
      vi.useFakeTimers();
      browser = { dataLayer: [], gtag: undefined, location: { href: "https://example.com/result/ABCDEFGHIJKL" }, addEventListener: vi.fn(), removeEventListener: vi.fn() };
      page = { title: "", documentElement: {} };
      vi.stubGlobal("window", browser);
      vi.stubGlobal("document", page);
      vi.stubGlobal("MutationObserver", class {
        constructor(callback: () => void) { onMutation = callback; }
        observe() {}
        disconnect() {}
      });
      prepareGtag();
    });

    it("waits for the title before sending", () => {
      trackPageView("G-TEST");
      expect(pageViews()).toHaveLength(0);

      page.title = "You should play a Troll Shaman | What Should I Play?";
      onMutation();
      vi.advanceTimersByTime(5000);

      expect(pageViews()).toEqual([["event", "page_view", expect.objectContaining({
        page_path: "/result/[id]", page_title: "You should play a Troll Shaman | What Should I Play?",
      })]]);
      expect(browser.removeEventListener).toHaveBeenCalledWith("pagehide", expect.any(Function));
    });

    it("sends without a title when none arrives in time", () => {
      trackPageView("G-TEST");
      vi.advanceTimersByTime(1000);

      expect(pageViews()).toHaveLength(1);
      expect(pageViews()[0][2]).toMatchObject({ page_path: "/result/[id]", page_title: undefined });
    });

    it("sends once without the next route's title when the route changes first", () => {
      const cleanup = trackPageView("G-TEST");
      page.title = "Quiz stats | What Should I Play?";
      cleanup();
      onMutation();
      vi.advanceTimersByTime(5000);

      expect(pageViews()).toHaveLength(1);
      expect(pageViews()[0][2]).toMatchObject({ page_location: "https://example.com/result/[id]", page_title: undefined });
    });

    it("sends when the visitor leaves before the title arrives", () => {
      trackPageView("G-TEST");
      const [event, onPageHide] = browser.addEventListener.mock.calls[0];
      expect(event).toBe("pagehide");
      onPageHide();

      expect(pageViews()).toHaveLength(1);
    });
  });
});
