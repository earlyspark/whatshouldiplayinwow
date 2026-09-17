import { afterEach, describe, expect, it, vi } from "vitest";
import { questions } from "@/data/questions";
import { createSavedResult } from "@/lib/scoring";
import { versionClassFeedbackField, versionFeedbackField, versionPairedFeedbackField } from "@/lib/feedback-stats";
import type { QuizAnswers } from "@/lib/result-schema";

const redisCalls = vi.hoisted(() => ({
  eval: vi.fn(),
  hgetall: vi.fn(),
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    eval = redisCalls.eval;
    hgetall = redisCalls.hgetall;
  },
}));
vi.mock("@/lib/redis-config", () => ({ redisConfig: () => ({ url: "https://example.invalid", token: "test" }) }));

import { readResultVotes, saveResultVote } from "./result-feedback";

function result() {
  const answers = Object.fromEntries(questions.map((question) => [question.id, [question.options[0].id]])) as QuizAnswers;
  return createSavedResult("test-result", answers);
}

afterEach(() => {
  redisCalls.eval.mockReset();
  redisCalls.hgetall.mockReset();
  vi.unstubAllEnvs();
});

describe("result feedback storage", () => {
  it("keeps local votes in memory even when Redis credentials exist", async () => {
    vi.stubEnv("VERCEL", undefined);
    vi.stubEnv("VERCEL_ENV", "production");
    const saved = result();
    expect(await saveResultVote(saved, "primary", "up")).toBe(true);
    expect(await saveResultVote(saved, "primary", "up")).toBe(false);
    expect((await readResultVotes(saved)).primary).toBe("up");
    expect(redisCalls.eval).not.toHaveBeenCalled();
  });

  it("uses isolated preview vote storage without touching aggregate stats", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    redisCalls.eval.mockResolvedValue(1);
    expect(await saveResultVote(result(), "runner-up-1", "down")).toBe(true);
    const [script, keys, args] = redisCalls.eval.mock.calls[0];
    expect(keys).toEqual(["wow-forever:result-feedback:v1:preview:result:test-result"]);
    expect(args.slice(0, 2)).toEqual(["runner-up-1", "down"]);
    expect(script).not.toContain("HINCRBY");
  });

  it("atomically replaces production counts in the result's creation month", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    redisCalls.eval.mockResolvedValue(1);
    const saved = result();
    expect(await saveResultVote(saved, "runner-up-2", "up")).toBe(true);
    const [script, keys, args] = redisCalls.eval.mock.calls[0];
    expect(keys).toEqual([
      "wow-forever:result-feedback:v1:result:test-result",
      `wow-forever:quiz-stats:v1:month:${saved.createdAt.slice(0, 7)}`,
      "wow-forever:quiz-stats:v1:months",
    ]);
    expect(args.slice(0, 2)).toEqual(["runner-up-2", "up"]);
    expect(args.slice(4)).toEqual([saved.quizVersion, saved.alternatives[1].classId]);
    expect(script).toContain("if previous == ARGV[2] then return 0 end");
    expect(script).toContain("HINCRBY");
    expect(script).toContain("-1");
    expect(script).toContain("EXPIREAT");
    expect(script).toContain('versionPrefix .. "class:"');
    expect(script).toContain('versionPrefix .. "paired:"');
    expect(script).toContain('wasTracked');
    expect(script).toContain('adjustPairs(-1)');
    expect(script).toContain('adjustPairs(1)');
  });

  it.each(["primary", "runner-up-1", "runner-up-2"] as const)("attributes a %s vote to its own recommended class", async (position) => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    redisCalls.eval.mockResolvedValue(1);
    const saved = result();
    await saveResultVote(saved, position, "down");
    const args = redisCalls.eval.mock.calls[0][2];
    const expectedClass = position === "primary" ? saved.primary.classId : saved.alternatives[position === "runner-up-1" ? 0 : 1].classId;
    expect(args).toEqual([position, "down", expect.any(String), saved.createdAt.slice(0, 7), saved.quizVersion, expectedClass]);
  });

  it("uses distinct version, class, and paired feedback fields", () => {
    expect(versionFeedbackField("1.22.0", "primary", "down")).toBe("version:1.22.0:feedback:primary:down");
    expect(versionClassFeedbackField("1.22.0", "mage", "primary", "up")).toBe("version:1.22.0:feedback:class:mage:primary:up");
    expect(versionPairedFeedbackField("1.22.0", "runner-up-2", "down", "up")).toBe("version:1.22.0:feedback:paired:runner-up-2:down:up");
  });
});
