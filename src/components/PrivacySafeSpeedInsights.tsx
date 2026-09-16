"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { redactedPageUrl } from "@/lib/analytics-url";

export default function PrivacySafeSpeedInsights() {
  return (
    <SpeedInsights beforeSend={(event) => {
      const url = redactedPageUrl(event.url, window.location.origin);
      if (url.pathname === "/result/[id]") {
        return { ...event, url: url.toString(), route: "/result/[id]" };
      }
      return { ...event, url: url.toString() };
    }} />
  );
}
