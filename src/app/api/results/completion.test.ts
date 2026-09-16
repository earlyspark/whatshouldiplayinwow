import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { questions } from "@/data/questions";
import type { SavedResult } from "@/lib/result-schema";

const store = vi.hoisted(() => new Map<string, SavedResult>());
vi.mock("@/lib/result-store", () => ({
  saveResult: async (result: SavedResult) => { store.set(result.id, result); },
  getResult: async (id: string) => store.get(id) ?? null,
}));

import { POST as createResult } from "./route";
import { POST as completeResult } from "./[id]/complete/route";

afterEach(() => {
  store.clear();
  vi.unstubAllEnvs();
});

describe("result completion receipt", () => {
  it("requires the creator's receipt and never tallies local or preview results", async () => {
    vi.stubEnv("VERCEL_ENV", undefined);
    vi.stubEnv("VERCEL", undefined);
    const answers = Object.fromEntries(questions.map((question) => [question.id, [question.options[0].id]]));
    const create = await createResult(new NextRequest("http://localhost:3000/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }));
    expect(create.status).toBe(200);
    const { id, receipt } = await create.json() as { id: string; receipt: string };
    expect(store.has(id)).toBe(true);

    const url = `http://localhost:3000/api/results/${id}/complete`;
    const context = { params: Promise.resolve({ id }) };
    const invalid = await completeResult(new NextRequest(url, {
      method: "POST", body: JSON.stringify({ receipt: "x".repeat(43) }),
    }), context);
    expect(invalid.status).toBe(403);

    const complete = await completeResult(new NextRequest(url, {
      method: "POST", body: JSON.stringify({ receipt }),
    }), context);
    expect(complete.status).toBe(200);
    expect(await complete.json()).toEqual({ counted: false });
  });
});
