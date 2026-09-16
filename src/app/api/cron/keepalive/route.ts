import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { keepStoreAlive } from "@/lib/result-store";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await keepStoreAlive();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
}
