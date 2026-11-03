import { describe, expect, it } from "vitest";
import { quizQuestionsOrScoringChanged } from "./quiz-version";

describe("quiz content version", () => {
  it("treats results from the current scoring as current", () => {
    expect(quizQuestionsOrScoringChanged("1.27.0")).toBe(false);
  });

  it("flags results from before the 1.27.0 scoring change", () => {
    expect(quizQuestionsOrScoringChanged("1.26.0")).toBe(true);
    expect(quizQuestionsOrScoringChanged("1.25.0")).toBe(true);
    expect(quizQuestionsOrScoringChanged("unknown")).toBe(true);
  });
});
