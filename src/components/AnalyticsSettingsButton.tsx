"use client";

import { openAnalyticsSettings } from "./AnalyticsConsent";

export default function AnalyticsSettingsButton() {
  return <button type="button" onClick={openAnalyticsSettings} className="link-bronze focus-ring">Analytics settings</button>;
}
