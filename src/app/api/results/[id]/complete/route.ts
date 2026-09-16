import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getResult } from "@/lib/result-store";
import { recordQuizCompletion } from "@/lib/quiz-stats";

interface Context { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{12}$/.test(id)) return NextResponse.json({ error: "Invalid result." }, { status: 400 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 256) return NextResponse.json({ error: "Invalid receipt." }, { status: 400 });

  let receipt: unknown;
  try {
    const body = await request.text();
    if (body.length > 256) return NextResponse.json({ error: "Invalid receipt." }, { status: 400 });
    receipt = (JSON.parse(body) as { receipt?: unknown }).receipt;
  } catch {
    return NextResponse.json({ error: "Invalid receipt." }, { status: 400 });
  }
  if (typeof receipt !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(receipt)) {
    return NextResponse.json({ error: "Invalid receipt." }, { status: 400 });
  }

  try {
    const result = await getResult(id);
    if (!result?.completionTokenHash) return NextResponse.json({ error: "Result not found." }, { status: 404 });
    const actual = createHash("sha256").update(receipt).digest();
    const expected = Buffer.from(result.completionTokenHash, "hex");
    if (!timingSafeEqual(actual, expected)) return NextResponse.json({ error: "Invalid receipt." }, { status: 403 });
    const counted = await recordQuizCompletion(result);
    return NextResponse.json({ counted }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to record completion." }, { status: 503 });
  }
}
