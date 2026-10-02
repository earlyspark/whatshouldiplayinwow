import { describe, expect, it } from "vitest";
import { quizQuestionsOrScoringChanged } from "./quiz-version";

describe("quiz content version", () => {
  it("keeps 1.25.0 results current after the 1.26.0 release-label bump", () => {
    expect(quizQuestionsOrScoringChanged("1.25.0")).toBe(false);
    expect(quizQuestionsOrScoringChanged("1.26.0")).toBe(false);
  });

  it("still flags older or unrecognized quiz content", () => {
    expect(quizQuestionsOrScoringChanged("1.24.0")).toBe(true);
    expect(quizQuestionsOrScoringChanged("unknown")).toBe(true);
  });
});
