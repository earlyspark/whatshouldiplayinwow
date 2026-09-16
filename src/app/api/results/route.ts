import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { hasRedisConfig, redisConfig } from "@/lib/redis-config";
import { answersSchema } from "@/lib/result-schema";
import { createSavedResult, validateAnswers } from "@/lib/scoring";
import { saveResult } from "@/lib/result-store";

const MAX_REQUEST_BYTES = 16_384;

function rateLimiter() {
  // Local testing reuses real Redis credentials for permalink testing. Keep
  // the deployed guard in place without making repeated local QA hit the quota.
  if (process.env.VERCEL_ENV !== "production" && process.env.VERCEL_ENV !== "preview") return null;
  const config = redisConfig();
  if (!config) return null;
  return new Ratelimit({
    redis: new Redis(config),
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    prefix: "ratelimit:wow-forever-results",
  });
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production" && !hasRedisConfig()) {
      return NextResponse.json({ error: "Result storage is not configured." }, { status: 503 });
    }

    const limiter = rateLimiter();
    if (limiter) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
      const { success, reset } = await limiter.limit(ip);
      if (!success) {
        // reset is an epoch timestamp for when the window frees up again.
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        const minutes = Math.ceil(retryAfter / 60);
        return NextResponse.json(
          { error: `You have created several results in the last hour. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`, retryAfter },
          { status: 429, headers: { "Retry-After": String(retryAfter) } },
        );
      }
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "This endpoint accepts JSON only." }, { status: 415 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "The submitted quiz is too large." }, { status: 413 });
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "The submitted quiz is too large." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "The submitted JSON is invalid." }, { status: 400 });
    }

    const answerPayload = typeof body === "object" && body !== null && "answers" in body ? body.answers : undefined;
    const parsed = answersSchema.safeParse(answerPayload);
    if (!parsed.success) return NextResponse.json({ error: "The quiz answers are incomplete or invalid." }, { status: 400 });
    validateAnswers(parsed.data);

    const id = randomBytes(9).toString("base64url");
    const receipt = randomBytes(32).toString("base64url");
    const result = {
      ...createSavedResult(id, parsed.data),
      completionTokenHash: createHash("sha256").update(receipt).digest("hex"),
    };
    await saveResult(result);
    return NextResponse.json({ id, receipt }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create a result.";
    const clientError = message.startsWith("Missing answer") || message.includes("accepts") || message.includes("invalid") || message.includes("conflicts");
    return NextResponse.json({ error: clientError ? message : "Unable to create your result right now." }, { status: clientError ? 400 : 500 });
  }
}
