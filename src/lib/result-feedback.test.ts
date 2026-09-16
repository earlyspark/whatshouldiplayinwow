import { afterEach, describe, expect, it, vi } from "vitest";
import { questions } from "@/data/questions";
import { createSavedResult } from "@/lib/scoring";
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
    expect(script).toContain("if previous == ARGV[2] then return 0 end");
    expect(script).toContain("HINCRBY");
    expect(script).toContain("-1");
    expect(script).toContain("EXPIREAT");
  });
});
