"use client";

import { openConsentSettings } from "./ConsentManager";
import { ADSENSE_ENABLED } from "@/lib/ad-consent";

export default function AnalyticsSettingsButton() {
  return <button type="button" onClick={openConsentSettings} className="link-bronze focus-ring">{ADSENSE_ENABLED ? "Ads and analytics settings" : "Analytics settings"}</button>;
}
