"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ANALYTICS_CONSENT_CHANGED_EVENT, ANALYTICS_CONSENT_KEY } from "@/lib/analytics-consent";
import { AD_CONSENT_CHANGED_EVENT, AD_CONSENT_KEY, ADSENSE_ENABLED } from "@/lib/ad-consent";

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

export default function AnalyticsConsent() {
  const [choice, setChoice] = useState<Choice | null | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const declineRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(ANALYTICS_CONSENT_KEY);
        const ads = localStorage.getItem(AD_CONSENT_KEY);
        if ((saved === "accepted" || saved === "declined") && saved === ads) {
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
    try { localStorage.setItem(AD_CONSENT_KEY, next); } catch {}
    if (next === "accepted") {
      window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGED_EVENT));
      window.dispatchEvent(new Event(AD_CONSENT_CHANGED_EVENT));
    }
    if (next === "declined" && choice === "accepted") {
      clearAnalyticsCookies();
      window.location.reload();
      return;
    }
    setChoice(next);
    if (settingsOpen) closeSettings();
  };

  return (
    <>
      {choice !== undefined && (choice === null || settingsOpen) && (
        <section aria-labelledby="cookie-consent-title" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
          <div className={`mx-auto max-w-2xl rounded-md border border-[var(--bronze-dim)] bg-[var(--surface)] p-3 shadow-2xl sm:p-4 ${settingsOpen && choice !== null ? "sm:flex sm:items-center sm:justify-between sm:gap-5" : "flex items-center justify-between gap-3 sm:gap-5"}`}>
            <div className="min-w-0">
              <h2 id="cookie-consent-title" className="text-sm font-semibold text-[var(--bone)]">{ADSENSE_ENABLED ? "Ads and analytics cookies" : "Analytics cookies"}</h2>
              <p className="mt-0.5 text-sm text-[var(--dim)]">
                {ADSENSE_ENABLED ? "Accept loads Google ads and analytics." : "Accept loads Google Analytics."} Details in{" "}
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
