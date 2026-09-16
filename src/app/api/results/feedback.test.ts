import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { questions } from "@/data/questions";
import { readResultVotes, saveResultVote } from "@/lib/result-feedback";
import type { SavedResult } from "@/lib/result-schema";

const store = vi.hoisted(() => new Map<string, SavedResult>());
vi.mock("@/lib/result-store", () => ({
  saveResult: async (result: SavedResult) => { store.set(result.id, result); },
  getResult: async (id: string) => store.get(id) ?? null,
}));

import { POST as createResult } from "./route";
import { GET as getFeedback, PUT as putFeedback } from "./[id]/feedback/route";

afterEach(() => {
  store.clear();
  vi.unstubAllEnvs();
});

async function create() {
  vi.stubEnv("VERCEL", undefined);
  vi.stubEnv("VERCEL_ENV", undefined);
  const answers = Object.fromEntries(questions.map((question) => [question.id, [question.options[0].id]]));
  const response = await createResult(new NextRequest("http://localhost:3000/api/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  }));
  expect(response.status).toBe(200);
  return response.json() as Promise<{ id: string; receipt: string }>;
}

function request(id: string, receipt?: string, position?: string, vote?: string) {
  return new NextRequest(`http://localhost:3000/api/results/${id}/feedback`, {
    method: position ? "PUT" : "GET",
    headers: {
      ...(receipt ? { Authorization: `Bearer ${receipt}` } : {}),
      ...(position ? { "Content-Type": "application/json" } : {}),
    },
    body: position ? JSON.stringify({ position, vote }) : undefined,
  });
}

describe("result feedback", () => {
  it("allows only the quiz creator to read and rate the three recommendations", async () => {
    const { id, receipt } = await create();
    const context = { params: Promise.resolve({ id }) };
    expect((await getFeedback(request(id), context)).status).toBe(401);
    expect((await getFeedback(request(id, "x".repeat(43)), context)).status).toBe(403);
    expect((await putFeedback(request(id, "x".repeat(43), "primary", "up"), context)).status).toBe(403);

    for (const position of ["primary", "runner-up-1", "runner-up-2"]) {
      const response = await putFeedback(request(id, receipt, position, "up"), context);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ position, vote: "up" });
    }
    const saved = await getFeedback(request(id, receipt), context);
    expect(saved.status).toBe(200);
    expect(saved.headers.get("cache-control")).toBe("no-store");
    expect(await saved.json()).toEqual({ votes: {
      primary: "up", "runner-up-1": "up", "runner-up-2": "up",
    } });
  });

  it("changes a vote, ignores retries, and rejects invalid positions or votes", async () => {
    const { id, receipt } = await create();
    const context = { params: Promise.resolve({ id }) };
    const savedResult = store.get(id)!;
    expect(await saveResultVote(savedResult, "primary", "up")).toBe(true);
    expect(await saveResultVote(savedResult, "primary", "up")).toBe(false);
    expect((await putFeedback(request(id, receipt, "primary", "down"), context)).status).toBe(200);
    expect((await readResultVotes(savedResult)).primary).toBe("down");
    expect((await putFeedback(request(id, receipt, "fourth", "up"), context)).status).toBe(400);
    expect((await putFeedback(request(id, receipt, "primary", "maybe"), context)).status).toBe(400);
    expect((await readResultVotes(savedResult)).primary).toBe("down");
  });

  it("does not rate a missing result or a result without a creator receipt", async () => {
    const { id, receipt } = await create();
    const context = { params: Promise.resolve({ id }) };
    const result = store.get(id)!;
    store.set(id, { ...result, completionTokenHash: undefined });
    expect((await getFeedback(request(id, receipt), context)).status).toBe(404);
    store.delete(id);
    expect((await putFeedback(request(id, receipt, "primary", "up"), context)).status).toBe(404);
  });
});
