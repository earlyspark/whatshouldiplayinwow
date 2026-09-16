import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function matchesPassword(actual: string, expected: string) {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function proxy(request: NextRequest) {
  const password = process.env.STATS_PASSWORD;
  if (!password) {
    return new NextResponse("Stats are not configured.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  let credentials = "";
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.startsWith("Basic ")) {
    try { credentials = Buffer.from(authorization.slice(6), "base64").toString("utf8"); } catch { /* Invalid credentials. */ }
  }
  const divider = credentials.indexOf(":");
  const username = divider >= 0 ? credentials.slice(0, divider) : "";
  const suppliedPassword = divider >= 0 ? credentials.slice(divider + 1) : "";
  if (username !== "admin" || !matchesPassword(suppliedPassword, password)) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Quiz stats", charset="UTF-8"',
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: "/stats" };
