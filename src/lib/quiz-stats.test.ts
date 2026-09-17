import { afterEach, describe, expect, it, vi } from "vitest";
import { questions } from "@/data/questions";
import { createSavedResult } from "@/lib/scoring";
import { completionIncrements, readMonthlyQuizStats, recordQuizCompletion } from "@/lib/quiz-stats";
import type { QuizAnswers } from "@/lib/result-schema";

function result() {
  const answers = Object.fromEntries(questions.map((question) => [question.id, [question.options[0].id]])) as QuizAnswers;
  answers.q3 = ["leveling", "dungeons"];
  return createSavedResult("test-result", answers);
}

afterEach(() => vi.unstubAllEnvs());

describe("completion statistics", () => {
  it("builds counts from a completed result, including ranked choices", () => {
    const saved = result();
    const counts = completionIncrements(saved);
    expect(counts.total).toBe(1);
    expect(counts["answer:q1:vanilla-wrath"]).toBe(1);
    expect(counts["answer:q3:leveling"]).toBe(1);
    expect(counts["answer:q3:dungeons"]).toBe(1);
    expect(counts["first:q3:leveling"]).toBe(1);
    expect(counts["first:q3:dungeons"]).toBeUndefined();
    expect(counts[`result:race:${saved.primary.raceId}`]).toBe(1);
    expect(counts[`quiz-version:${saved.quizVersion}`]).toBe(1);
    expect(counts[`version:${saved.quizVersion}:result:race:${saved.primary.raceId}`]).toBe(1);
    expect(counts[`version:${saved.quizVersion}:result:class:${saved.primary.classId}`]).toBe(1);
    expect(counts[`version:${saved.quizVersion}:result:pair:${saved.primary.raceId}:${saved.primary.classId}`]).toBe(1);
  });

  it("keeps versioned recommendations separate while retaining all-time counts", () => {
    const saved = result();
    saved.quizVersion = "1.16.0";
    const counts = completionIncrements(saved);
    expect(counts[`result:class:${saved.primary.classId}`]).toBe(1);
    expect(counts[`version:1.16.0:result:class:${saved.primary.classId}`]).toBe(1);
    expect(counts[`version:1.17.0:result:class:${saved.primary.classId}`]).toBeUndefined();
  });

  it.each([undefined, "development", "preview"])("never tallies outside Vercel production (%s)", async (environment) => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", environment);
    expect(await recordQuizCompletion(result())).toBe(false);
    expect(await readMonthlyQuizStats()).toEqual([]);
  });

  it("never tallies on localhost even if VERCEL_ENV is accidentally set to production", async () => {
    vi.stubEnv("VERCEL", undefined);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await recordQuizCompletion(result())).toBe(false);
  });
});
