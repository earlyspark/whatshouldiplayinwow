import { NextRequest, NextResponse } from "next/server";
import { keepStoreAlive } from "@/lib/result-store";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await keepStoreAlive();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
}
