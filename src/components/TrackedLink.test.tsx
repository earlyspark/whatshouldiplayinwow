import { afterEach, describe, expect, it, vi } from "vitest";
import TrackedLink from "./TrackedLink";

afterEach(() => vi.unstubAllGlobals());

describe("TrackedLink", () => {
  it("reports a same-site click with its full link URL", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", {
      gtag,
      location: { href: "https://example.com/about", origin: "https://example.com", hostname: "example.com" },
    });

    const link = TrackedLink({ href: "/pairings", children: "Spec pairings" });
    link.props.onClick();

    expect(gtag).toHaveBeenCalledWith("event", "click", expect.objectContaining({
      link_url: "https://example.com/pairings",
      link_domain: "example.com",
      outbound: false,
      page_location: "https://example.com/about",
    }));
    expect(link.props.href).toBe("/pairings");
  });
});
