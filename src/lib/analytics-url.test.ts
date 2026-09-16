import { describe, expect, it } from "vitest";
import { redactedPageUrl } from "@/lib/analytics-url";

describe("analytics URL redaction", () => {
  it("removes a result ID and query parameters", () => {
    expect(redactedPageUrl("https://example.com/result/private-id?receipt=secret#share").toString())
      .toBe("https://example.com/result/[id]");
  });

  it("keeps ordinary page paths", () => {
    expect(redactedPageUrl("https://example.com/methodology?source=test").toString())
      .toBe("https://example.com/methodology");
  });
});
