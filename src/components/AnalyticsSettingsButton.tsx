"use client";

import { openConsentSettings } from "./ConsentManager";

export default function AnalyticsSettingsButton() {
  return <button type="button" onClick={openConsentSettings} className="link-bronze focus-ring">Ads and analytics settings</button>;
}
