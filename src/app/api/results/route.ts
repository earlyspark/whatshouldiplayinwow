import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { hasRedisConfig, redisConfig } from "@/lib/redis-config";
import { answersSchema } from "@/lib/result-schema";
import { createSavedResult, validateAnswers } from "@/lib/scoring";
import { saveResult } from "@/lib/result-store";

function rateLimiter() {
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
      const { success } = await limiter.limit(ip);
      if (!success) return NextResponse.json({ error: "Too many results created. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = answersSchema.safeParse(body?.answers);
    if (!parsed.success) return NextResponse.json({ error: "The quiz answers are incomplete or invalid." }, { status: 400 });
    validateAnswers(parsed.data);

    const id = randomBytes(9).toString("base64url");
    const result = createSavedResult(id, parsed.data);
    await saveResult(result);
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create a result.";
    const clientError = message.startsWith("Missing answer") || message.includes("accepts") || message.includes("invalid") || message.includes("conflicts");
    return NextResponse.json({ error: clientError ? message : "Unable to create your result right now." }, { status: clientError ? 400 : 500 });
  }
}
