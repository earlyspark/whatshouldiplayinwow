import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VersionFeedback } from "./VersionFeedback";
import { versionClassFeedbackField, versionFeedbackField, versionPairedFeedbackField } from "@/lib/feedback-stats";

describe("version feedback display", () => {
  it("labels same-class and different-class alternatives and uses both-rated denominators", () => {
    const version = "1.22.0";
    const counts = {
      [versionFeedbackField(version, "primary", "down")]: 3,
      [versionFeedbackField(version, "runner-up-1", "up")]: 2,
      [versionFeedbackField(version, "runner-up-2", "up")]: 2,
      [versionClassFeedbackField(version, "mage", "primary", "down")]: 2,
      [versionPairedFeedbackField(version, "runner-up-1", "down", "up")]: 1,
      [versionPairedFeedbackField(version, "runner-up-1", "up", "up")]: 1,
      [versionPairedFeedbackField(version, "runner-up-2", "down", "up")]: 2,
      [versionPairedFeedbackField(version, "runner-up-2", "down", "down")]: 1,
    };
    const html = renderToStaticMarkup(<VersionFeedback counts={counts} version={version} />);
    expect(html).toContain("Second: same class, another race");
    expect(html).toContain("Third: different class");
    expect(html).toContain("1 of 2 both-rated results");
    expect(html).toContain("2 of 3 both-rated results");
    expect(html).toContain("Earlier votes are not backfilled");
  });

  it("shows an empty state before a version receives tracked votes", () => {
    const html = renderToStaticMarkup(<VersionFeedback counts={{}} version="1.22.0" />);
    expect(html).toContain("No newly tracked feedback");
  });
});
