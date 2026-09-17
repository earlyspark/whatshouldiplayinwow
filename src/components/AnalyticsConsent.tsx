"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import GoogleAnalyticsPageViews from "./GoogleAnalyticsPageViews";
import { ANALYTICS_CONSENT_CHANGED_EVENT, ANALYTICS_CONSENT_KEY } from "@/lib/analytics-consent";
import { prepareGtag } from "@/lib/gtag";

const SETTINGS_EVENT = "wow-forever-open-analytics-settings";
type Choice = "accepted" | "declined";

function clearAnalyticsCookies() {
  const names = document.cookie.split(";").map((part) => part.trim().split("=")[0]);
  const host = window.location.hostname;
  const parent = host.startsWith("www.") ? host.slice(4) : host;
  for (const name of names) {
    if (!/^(?:_ga(?:_|$)|_gid$)/.test(name)) continue;
    for (const domain of [undefined, host, parent]) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
    }
  }
}

export default function AnalyticsConsent({ measurementId }: { measurementId: string }) {
  const [choice, setChoice] = useState<Choice | null | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const declineRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(ANALYTICS_CONSENT_KEY);
        if (saved === "accepted" || saved === "declined") {
          if (saved === "accepted") prepareGtag();
          setChoice(saved);
          return;
        }
      } catch {}
      setChoice(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const openSettings = () => {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setSettingsOpen(true);
      window.requestAnimationFrame(() => declineRef.current?.focus());
    };
    window.addEventListener(SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(SETTINGS_EVENT, openSettings);
  }, []);

  const closeSettings = () => {
    setSettingsOpen(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  };

  const choose = (next: Choice) => {
    try { localStorage.setItem(ANALYTICS_CONSENT_KEY, next); } catch {}
    if (next === "accepted") {
      prepareGtag();
      window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGED_EVENT));
    }
    if (next === "declined" && choice === "accepted") {
      delete window.gtag;
      clearAnalyticsCookies();
      window.location.reload();
      return;
    }
    setChoice(next);
    if (settingsOpen) closeSettings();
  };

  return (
    <>
      {choice === "accepted" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
            onReady={() => {
              window.gtag?.("js", new Date());
              window.gtag?.("config", measurementId, { send_page_view: false });
              setScriptReady(true);
            }}
          />
          {scriptReady && <GoogleAnalyticsPageViews measurementId={measurementId} />}
        </>
      )}

      {choice !== undefined && (choice === null || settingsOpen) && (
        <section aria-labelledby="cookie-consent-title" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
          <div className={`mx-auto max-w-2xl rounded-md border border-[var(--bronze-dim)] bg-[var(--surface)] p-3 shadow-2xl sm:p-4 ${settingsOpen && choice !== null ? "sm:flex sm:items-center sm:justify-between sm:gap-5" : "flex items-center justify-between gap-3 sm:gap-5"}`}>
            <div className="min-w-0">
              <h2 id="cookie-consent-title" className="text-sm font-semibold text-[var(--bone)]">Cookie consent</h2>
              <p className="mt-0.5 text-sm text-[var(--dim)]">
                Read more in{" "}
                <Link href="/methodology#privacy" className="link-bronze focus-ring">privacy and cookies</Link>.
              </p>
            </div>
            <div className={`flex shrink-0 items-center gap-1.5 sm:gap-2 ${settingsOpen && choice !== null ? "mt-2 sm:mt-0" : ""}`}>
              <button type="button" onClick={() => choose("accepted")} className="focus-ring min-h-11 cursor-pointer rounded-sm bg-[var(--bronze)] px-3 text-sm font-semibold text-[#1d1608] hover:bg-[#d7a55c]">Accept</button>
              <button ref={declineRef} type="button" onClick={() => choose("declined")} className="focus-ring min-h-11 cursor-pointer rounded-sm border border-[var(--bronze-dim)] px-2.5 text-sm font-semibold text-[var(--bone)] hover:border-[var(--bronze)]">Decline</button>
              {settingsOpen && choice !== null && <button type="button" onClick={closeSettings} className="focus-ring min-h-11 cursor-pointer px-2 text-sm text-[var(--dim)] hover:text-[var(--bone)]">Cancel</button>}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function openAnalyticsSettings() {
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}
