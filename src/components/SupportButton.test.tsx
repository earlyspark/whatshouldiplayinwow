import { afterEach, describe, expect, it, vi } from "vitest";
import SupportButton from "./SupportButton";

afterEach(() => vi.unstubAllGlobals());

describe("SupportButton", () => {
  it("tracks a dedicated support click without exposing the result ID", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", {
      gtag,
      location: { href: "https://example.com/result/ABCDEFGHIJKL" },
    });

    const button = SupportButton({ fontClassName: "test-font" });
    button.props.onClick();

    expect(gtag).toHaveBeenCalledWith("event", "support_click", expect.objectContaining({
      placement: "result_above_race",
      destination_host: "buymeacoffee.com",
      page_location: "https://example.com/result/[id]",
    }));
    expect(button.props.href).toBe("https://buymeacoffee.com/earlyspark");
  });
});
