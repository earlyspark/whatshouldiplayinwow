import { afterEach, describe, expect, it, vi } from "vitest";
import { questions } from "@/data/questions";
import { createSavedResult } from "@/lib/scoring";
import type { QuizAnswers } from "@/lib/result-schema";

vi.mock("@/lib/redis-config", () => ({ redisConfig: () => null }));

import { getResult, saveResult } from "@/lib/result-store";
import { resultExpiresAt } from "@/lib/result-retention";

afterEach(() => vi.useRealTimers());

describe("result retention", () => {
  it("expires a result 90 days after creation", () => {
    expect(new Date(resultExpiresAt("2027-02-01T12:30:00.000Z")).toISOString()).toBe("2027-05-02T12:30:00.000Z");
  });

  it("keeps results created under the 12-month policy until the start of 2027", () => {
    expect(new Date(resultExpiresAt("2026-09-01T00:00:00.000Z")).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("treats an invalid creation date as expired", () => {
    expect(resultExpiresAt("not a date")).toBeNaN();
  });

  it("keeps a result until its 90-day window ends", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-03-01T00:00:00.000Z"));
    const answers = Object.fromEntries(questions.map((question) => [question.id, [question.options[0].id]])) as QuizAnswers;
    const result = createSavedResult("retention123", answers);
    await saveResult(result);

    vi.setSystemTime(new Date(resultExpiresAt(result.createdAt) - 1));
    expect(await getResult(result.id)).toEqual(result);

    vi.setSystemTime(new Date(resultExpiresAt(result.createdAt)));
    expect(await getResult(result.id)).toBeNull();
  });

  it("does not look up malformed IDs and treats corrupted records as missing", async () => {
    expect(await getResult("../other-key")).toBeNull();
    globalThis.__wowForeverResults?.set("brokenid1234", "{invalid" as never);
    expect(await getResult("brokenid1234")).toBeNull();
    globalThis.__wowForeverResults?.delete("brokenid1234");
  });
});
