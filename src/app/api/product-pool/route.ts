import { NextResponse } from "next/server";
import { getEquipmentGroups } from "@/lib/amazon";

/** The path avoids "ads": blocklists match /ads/ and /ad/ URL substrings. */
export const dynamic = "force-dynamic";

export async function GET() {
  const groups = await getEquipmentGroups("homepage");
  return NextResponse.json(
    { groups },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60",
      },
    },
  );
}
