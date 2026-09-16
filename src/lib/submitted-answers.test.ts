import { describe, expect, it } from "vitest";
import { questions } from "@/data/questions";
import { answersSchema } from "@/lib/result-schema";
import { validateAnswers } from "@/lib/scoring";

describe("submitted quiz answers", () => {
  const valid = Object.fromEntries(questions.map((question) => [question.id, [question.options[0].id]]));

  it("rejects extra question keys instead of storing their arbitrary strings", () => {
    const parsed = answersSchema.parse({ ...valid, q9999: ["unsolicited value"] });
    expect(() => validateAnswers(parsed)).toThrow(/invalid question/);
  });

  it("still accepts the current question set and rejects duplicate ranks", () => {
    expect(() => validateAnswers(answersSchema.parse(valid))).not.toThrow();
    const ranked = questions.find((question) => question.type === "ranked")!;
    const parsed = answersSchema.parse({ ...valid, [ranked.id]: [ranked.options[0].id, ranked.options[0].id] });
    expect(() => validateAnswers(parsed)).toThrow(/duplicate/);
  });
});
