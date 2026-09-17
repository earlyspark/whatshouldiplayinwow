"use client";

import { useEffect } from "react";
import { ANALYTICS_CONSENT_CHANGED_EVENT, ANALYTICS_CONSENT_KEY } from "@/lib/analytics-consent";
import { prepareGtag, trackPageError } from "@/lib/gtag";

export default function ErrorAnalytics({ type, loadScript = false }: {
  type: "not_found" | "render_error";
  loadScript?: boolean;
}) {
  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production" || !measurementId) return;
    let sent = false;

    const sendIfConsented = (consentedForVisit = false) => {
      if (sent) return;
      if (!consentedForVisit) {
        try {
          if (localStorage.getItem(ANALYTICS_CONSENT_KEY) !== "accepted") return;
        } catch { return; }
      }

      prepareGtag();
      window.gtag?.("js", new Date());
      window.gtag?.("config", measurementId, { send_page_view: false });
      trackPageError(measurementId, type);
      sent = true;

      if (loadScript && !document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js?id="]')) {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.append(script);
      }
    };

    sendIfConsented();
    const onConsentAccepted = () => sendIfConsented(true);
    window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, onConsentAccepted);
    return () => window.removeEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, onConsentAccepted);
  }, [loadScript, type]);

  return null;
}
