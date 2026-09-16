import { NextResponse } from "next/server";
import { getProductPool } from "@/lib/amazon";
import { adSelection } from "@/lib/amazon-config";

/**
 * Serves the affiliate product pool to the browser.
 *
 * The quiz is a client-side stepper on a statically rendered page, so it cannot
 * take products as server props without making the landing page dynamic. This
 * route keeps that page static and lets the quiz rotate products per question.
 *
 * Only public catalog data crosses the wire; credentials stay on the server.
 * The pool is already cached for six hours, so this costs no Amazon calls.
 *
 * The path deliberately avoids the word "ads": blocklists match URL substrings
 * like /ads/ and /ad/, which would make this route fail for a large share of
 * readers before any of the ad markup is even reached.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getProductPool();
  return NextResponse.json(
    { products, pinnedAsin: adSelection().pinnedAsin },
    {
      headers: {
        // The public, shared pool may be reused briefly at the CDN to spare
        // Redis reads and absorb spikes. Redis refreshes it every six hours.
        "Cache-Control": "public, s-maxage=60",
      },
    },
  );
}
