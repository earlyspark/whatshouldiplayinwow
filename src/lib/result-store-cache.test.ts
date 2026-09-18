import { afterEach, expect, it, vi } from "vitest";
import { questions } from "@/data/questions";
import { createSavedResult } from "@/lib/scoring";
import type { QuizAnswers } from "@/lib/result-schema";

const redisCalls = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));
vi.mock("@upstash/redis", () => ({ Redis: class {
  get = redisCalls.get;
  set = redisCalls.set;
  del = redisCalls.del;
} }));
vi.mock("@/lib/redis-config", () => ({ redisConfig: () => ({ url: "https://example.upstash.io", token: "test-token" }) }));

import { getResult, saveResult } from "@/lib/result-store";
import { resultExpiresAt } from "@/lib/result-retention";

const answers = Object.fromEntries(questions.map((question) => [question.id, [question.options[0].id]])) as QuizAnswers;

afterEach(() => {
  vi.useRealTimers();
  redisCalls.get.mockReset();
  redisCalls.set.mockReset();
  redisCalls.del.mockReset();
});

it("reads a stored result from Redis once and then from memory", async () => {
  const result = createSavedResult("cachedread12", answers);
  redisCalls.get.mockResolvedValue(JSON.stringify(result));

  expect(await getResult(result.id)).toEqual(result);
  expect(await getResult(result.id)).toEqual(result);
  expect(redisCalls.get).toHaveBeenCalledTimes(1);
});

it("serves a just-saved result without reading Redis", async () => {
  const result = createSavedResult("cachedsave12", answers);
  redisCalls.set.mockResolvedValue("OK");

  await saveResult(result);
  expect(await getResult(result.id)).toEqual(result);
  expect(redisCalls.get).not.toHaveBeenCalled();
});

it("stops serving a remembered result once it expires", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2027-03-01T00:00:00.000Z"));
  const result = createSavedResult("cachedexpir1", answers);
  redisCalls.set.mockResolvedValue("OK");
  await saveResult(result);

  vi.setSystemTime(new Date(resultExpiresAt(result.createdAt)));
  expect(await getResult(result.id)).toBeNull();
  expect(redisCalls.get).not.toHaveBeenCalled();
});

it("does not remember missing results", async () => {
  redisCalls.get.mockResolvedValue(null);

  expect(await getResult("missingres12")).toBeNull();
  expect(await getResult("missingres12")).toBeNull();
  expect(redisCalls.get).toHaveBeenCalledTimes(2);
});
