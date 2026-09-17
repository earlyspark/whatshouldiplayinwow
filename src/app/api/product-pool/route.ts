import { NextResponse } from "next/server";
import { getProductPool } from "@/lib/amazon";
import { adSelection } from "@/lib/amazon-config";

/** The path avoids "ads": blocklists match /ads/ and /ad/ URL substrings. */
export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getProductPool();
  return NextResponse.json(
    { products, pinnedAsin: adSelection().pinnedAsin },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60",
      },
    },
  );
}
