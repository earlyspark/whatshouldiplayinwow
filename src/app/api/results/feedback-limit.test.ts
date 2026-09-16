import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { questions } from "@/data/questions";
import { createSavedResult } from "@/lib/scoring";
import type { QuizAnswers, SavedResult } from "@/lib/result-schema";

const mocked = vi.hoisted(() => ({
  result: null as SavedResult | null,
  limit: vi.fn(),
  saveVote: vi.fn(),
}));

vi.mock("@/lib/result-store", () => ({ getResult: async () => mocked.result }));
vi.mock("@/lib/result-feedback", () => ({
  readResultVotes: vi.fn(),
  saveResultVote: mocked.saveVote,
}));
vi.mock("@/lib/redis-config", () => ({ redisConfig: () => ({ url: "https://example.invalid", token: "test" }) }));
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() { return {}; }
    limit = mocked.limit;
  },
}));

import { PUT } from "./[id]/feedback/route";

afterEach(() => {
  mocked.result = null;
  mocked.limit.mockReset();
  mocked.saveVote.mockReset();
  vi.unstubAllEnvs();
});

describe("feedback write limit", () => {
  it("rejects excessive production changes before writing a vote", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    const receipt = "a".repeat(43);
    const answers = Object.fromEntries(questions.map((question) => [question.id, [question.options[0].id]])) as QuizAnswers;
    mocked.result = {
      ...createSavedResult("abcdefghijkl", answers),
      completionTokenHash: createHash("sha256").update(receipt).digest("hex"),
    };
    mocked.limit.mockResolvedValue({ success: false, reset: Date.now() + 60_000 });
    const id = mocked.result.id;
    const response = await PUT(new NextRequest(`https://example.com/api/results/${id}/feedback`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${receipt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ position: "primary", vote: "up" }),
    }), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(mocked.saveVote).not.toHaveBeenCalled();
  });
});
