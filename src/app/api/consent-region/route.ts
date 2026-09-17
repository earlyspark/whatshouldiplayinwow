import { headers } from "next/headers";
import { needsEuropeanConsent } from "@/lib/consent-region";
import { isProductionDeployment } from "@/lib/deploy-env";

export async function GET() {
  // Cloudflare sets CF-IPCountry only on proxied (orange cloud) records.
  const country = (await headers()).get("cf-ipcountry");
  // A missing location must not accidentally use the lighter consent flow.
  const european = needsEuropeanConsent(country, isProductionDeployment());
  return Response.json({ european }, { headers: { "Cache-Control": "private, no-store" } });
}
