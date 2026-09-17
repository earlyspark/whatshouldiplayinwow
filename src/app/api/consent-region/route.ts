import { headers } from "next/headers";
import { needsEuropeanConsent } from "@/lib/consent-region";

export async function GET() {
  const country = (await headers()).get("x-vercel-ip-country");
  // A missing location must not accidentally use the lighter consent flow.
  const european = needsEuropeanConsent(country, process.env.VERCEL_ENV === "production");
  return Response.json({ european }, { headers: { "Cache-Control": "private, no-store" } });
}
