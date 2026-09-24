"use client";

import { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import AnalyticsConsent from "./AnalyticsConsent";
import GoogleAnalyticsPageViews from "./GoogleAnalyticsPageViews";
import { ANALYTICS_CONSENT_CHANGED_EVENT, ANALYTICS_CONSENT_KEY } from "@/lib/analytics-consent";
import { AD_CONSENT_CHANGED_EVENT, AD_CONSENT_KEY, ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/lib/ad-consent";
import { prepareGtag } from "@/lib/gtag";

type TCData = {
  eventStatus?: string;
  listenerId?: number;
  purpose?: { consents?: Record<number, boolean> };
  vendor?: { consents?: Record<number, boolean> };
};

declare global {
  interface Window {
    __tcfapi?: (command: string, version: number, callback: (data: TCData, success: boolean) => void, parameter?: number) => void;
    googlefc?: { callbackQueue: Array<() => void>; showRevocationMessage: () => void };
  }
}

function AnalyticsLoader({ measurementId }: { measurementId?: string }) {
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      try { setAllowed(localStorage.getItem(ANALYTICS_CONSENT_KEY) === "accepted"); }
      catch { setAllowed(false); }
    };
    check();
    window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, check);
  }, []);

  if (!measurementId || !allowed) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" onReady={() => {
      prepareGtag();
      window.gtag?.("js", new Date());
      window.gtag?.("config", measurementId, { send_page_view: false });
      setReady(true);
    }} />
    {ready && <GoogleAnalyticsPageViews measurementId={measurementId} />}
  </>;
}

function EuropeanConsent({ onDecision }: { onDecision: () => void }) {
  useEffect(() => {
    let attempts = 0;
    let listenerId: number | undefined;
    function subscribe() {
      if (!window.__tcfapi) {
        if (++attempts > 40) clearInterval(timer);
        return;
      }
      clearInterval(timer);
      window.__tcfapi("addEventListener", 2, (data, success) => {
        listenerId = data.listenerId;
        if (!success || !["tcloaded", "useractioncomplete"].includes(data.eventStatus ?? "")) return;
        // AdSense maps Purpose 1 to analytics storage when analytics consent mode is enabled.
        const storageAllowed = data.purpose?.consents?.[1] === true;
        const adsAllowed = storageAllowed && data.vendor?.consents?.[755] === true;
        const analyticsAllowed = storageAllowed;
        let wasAllowed = false;
        try {
          wasAllowed = localStorage.getItem(ANALYTICS_CONSENT_KEY) === "accepted";
          localStorage.setItem(AD_CONSENT_KEY, adsAllowed ? "accepted" : "declined");
          localStorage.setItem(ANALYTICS_CONSENT_KEY, analyticsAllowed ? "accepted" : "declined");
        } catch {}
        onDecision();
        window.dispatchEvent(new Event(AD_CONSENT_CHANGED_EVENT));
        window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGED_EVENT));
        if (wasAllowed && !analyticsAllowed) window.location.reload();
      });
    }
    const timer = setInterval(subscribe, 500);
    subscribe();
    return () => {
      clearInterval(timer);
      if (listenerId !== undefined) window.__tcfapi?.("removeEventListener", 2, () => {}, listenerId);
    };
  }, [onDecision]);

  return <Script src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} strategy="afterInteractive" crossOrigin="anonymous" />;
}

export function openConsentSettings() {
  if (window.googlefc?.showRevocationMessage) {
    window.googlefc.callbackQueue.push(window.googlefc.showRevocationMessage);
  } else {
    window.dispatchEvent(new Event("wow-forever-open-analytics-settings"));
  }
}

export default function ConsentManager({ measurementId }: { measurementId?: string }) {
  // Google's EEA consent message loads through the AdSense script, so without AdSense everyone gets the site banner.
  const [region, setRegion] = useState<"europe" | "other" | null>(ADSENSE_ENABLED ? null : "other");
  const [europeDecision, setEuropeDecision] = useState(false);
  const onEuropeanDecision = useCallback(() => setEuropeDecision(true), []);
  useEffect(() => {
    if (!ADSENSE_ENABLED) return;
    let active = true;
    fetch("/api/consent-region", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { european: true })
      .then((data: { european: boolean }) => {
        if (!active) return;
        setRegion(data.european ? "europe" : "other");
        if (!data.european) {
          window.dispatchEvent(new Event(AD_CONSENT_CHANGED_EVENT));
          window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGED_EVENT));
        }
      })
      .catch(() => { if (active) setRegion("europe"); });
    return () => { active = false; };
  }, []);

  return <>
    {region === "europe" && <EuropeanConsent onDecision={onEuropeanDecision} />}
    {region === "other" && <AnalyticsConsent />}
    {(region === "other" || (region === "europe" && europeDecision)) && <AnalyticsLoader measurementId={measurementId} />}
  </>;
}
