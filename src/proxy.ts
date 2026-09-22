import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { clientIp } from "@/lib/client-ip";
import { deployEnv } from "@/lib/deploy-env";
import { redisConfig } from "@/lib/redis-config";

// The username was public before it moved to configuration, so anyone still sending it is guessing.
const RETIRED_USERNAME = "admin";

const privateHeaders = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

function matches(actual: string, expected: string) {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function statsLimiters() {
  // Local runs share production Redis, so keep local logins from writing lockout keys.
  if (deployEnv() === "development") return null;
  const config = redisConfig();
  if (!config) return null;
  const redis = new Redis(config);
  return {
    failures: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "ratelimit:wow-forever-stats-failures" }),
    retired: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(1, "1 d"), prefix: "ratelimit:wow-forever-stats-retired" }),
  };
}

function suppliedCredentials(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Basic ")) return null;
  let credentials = "";
  try { credentials = Buffer.from(authorization.slice(6), "base64").toString("utf8"); } catch {}
  const divider = credentials.indexOf(":");
  if (divider < 0) return { username: "", password: "" };
  return { username: credentials.slice(0, divider), password: credentials.slice(divider + 1) };
}

function challenge() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { ...privateHeaders, "WWW-Authenticate": 'Basic realm="Quiz stats", charset="UTF-8"' },
  });
}

function tooManyAttempts(reset: number) {
  // reset is an epoch timestamp for when the window frees up again.
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return new NextResponse("Too many sign-in attempts. Try again later.", {
    status: 429,
    headers: { ...privateHeaders, "Retry-After": String(retryAfter) },
  });
}

export async function proxy(request: NextRequest) {
  const username = process.env.STATS_USERNAME;
  const password = process.env.STATS_PASSWORD;
  if (!username || !password) {
    return new NextResponse("Stats are not configured.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  // A request without credentials is how the browser asks for the login prompt, so it is not an attempt.
  const supplied = suppliedCredentials(request);
  if (!supplied) return challenge();

  const limiters = statsLimiters();
  const ip = clientIp(request);
  if (limiters) {
    const { remaining, reset } = await limiters.failures.getRemaining(ip);
    if (remaining <= 0) return tooManyAttempts(reset);
  }

  if (supplied.username === RETIRED_USERNAME) {
    if (limiters) {
      const [retired] = await Promise.all([limiters.retired.limit(ip), limiters.failures.limit(ip)]);
      if (!retired.success) return tooManyAttempts(retired.reset);
    }
    return challenge();
  }

  // Both comparisons always run so a wrong username takes as long as a wrong password.
  const usernameMatches = matches(supplied.username, username);
  const passwordMatches = matches(supplied.password, password);
  if (!usernameMatches || !passwordMatches) {
    if (limiters) await limiters.failures.limit(ip);
    return challenge();
  }

  const response = NextResponse.next();
  for (const [name, value] of Object.entries(privateHeaders)) response.headers.set(name, value);
  return response;
}

export const config = { matcher: "/stats" };
