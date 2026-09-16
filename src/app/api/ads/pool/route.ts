import { NextResponse } from "next/server";
import { getProductPool } from "@/lib/amazon";

/**
 * Serves the affiliate product pool to the browser.
 *
 * The quiz is a client-side stepper on a statically rendered page, so it cannot
 * take products as server props without making the landing page dynamic. This
 * route keeps that page static and lets the quiz rotate products per question.
 *
 * Only public catalog data crosses the wire; credentials stay on the server.
 * The pool is already cached for six hours, so this costs no Amazon calls.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getProductPool();
  return NextResponse.json(
    { products },
    {
      headers: {
        // Prices must stay inside Amazon's 24 hour freshness rule, and the
        // server-side pool already refreshes every six.
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600",
      },
    },
  );
}
