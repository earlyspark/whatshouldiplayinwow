import { createHash, timingSafeEqual } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { isProductionDeployment } from "@/lib/deploy-env";
import { feedbackRequestSchema } from "@/lib/feedback-types";
import { redisConfig } from "@/lib/redis-config";
import { readResultVotes, saveResultVote } from "@/lib/result-feedback";
import { getResult } from "@/lib/result-store";
import type { SavedResult } from "@/lib/result-schema";

interface Context { params: Promise<{ id: string }> }

const noStore = { "Cache-Control": "no-store" };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: noStore });
}

async function authorizedResult(request: NextRequest, id: string): Promise<SavedResult | NextResponse> {
  if (!/^[A-Za-z0-9_-]{12}$/.test(id)) return json({ error: "Invalid result." }, 400);
  const receipt = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if (!receipt) return json({ error: "Creator receipt required." }, 401);
  const result = await getResult(id);
  if (!result?.completionTokenHash) return json({ error: "Result not found." }, 404);
  const actual = createHash("sha256").update(receipt).digest();
  const expected = Buffer.from(result.completionTokenHash, "hex");
  if (!timingSafeEqual(actual, expected)) return json({ error: "This browser cannot rate this result." }, 403);
  return result;
}

function rateLimiter() {
  if (!isProductionDeployment()) return null;
  const config = redisConfig();
  if (!config) throw new Error("Feedback rate limiting is not configured.");
  return new Ratelimit({
    redis: new Redis(config),
    limiter: Ratelimit.slidingWindow(30, "1 h"),
    prefix: "ratelimit:wow-forever-feedback",
  });
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const result = await authorizedResult(request, id);
    if (result instanceof NextResponse) return result;
    return json({ votes: await readResultVotes(result) });
  } catch {
    return json({ error: "Unable to load ratings right now." }, 503);
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const result = await authorizedResult(request, id);
    if (result instanceof NextResponse) return result;
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return json({ error: "This endpoint accepts JSON only." }, 415);
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > 256) return json({ error: "Invalid rating." }, 400);
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 256) return json({ error: "Invalid rating." }, 400);
    let payload: unknown;
    try { payload = JSON.parse(body); }
    catch { return json({ error: "Invalid rating." }, 400); }
    const parsed = feedbackRequestSchema.safeParse(payload);
    if (!parsed.success) return json({ error: "Invalid rating." }, 400);

    const limiter = rateLimiter();
    if (limiter) {
      const { success, reset } = await limiter.limit(id);
      if (!success) {
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return NextResponse.json(
          { error: "Too many rating changes. Please try again later." },
          { status: 429, headers: { ...noStore, "Retry-After": String(retryAfter) } },
        );
      }
    }

    const { position, vote } = parsed.data;
    await saveResultVote(result, position, vote);
    return json({ position, vote });
  } catch {
    return json({ error: "Unable to save your rating right now." }, 503);
  }
}
