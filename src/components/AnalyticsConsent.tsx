"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import GoogleAnalyticsPageViews from "./GoogleAnalyticsPageViews";

const CONSENT_KEY = "wow-forever-analytics-consent";
const SETTINGS_EVENT = "wow-forever-open-analytics-settings";
type Choice = "accepted" | "declined";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function prepareGtag() {
  window.dataLayer ??= [];
  window.gtag ??= (...args: unknown[]) => { window.dataLayer?.push(args); };
}

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
        const saved = localStorage.getItem(CONSENT_KEY);
        if (saved === "accepted" || saved === "declined") {
          if (saved === "accepted") prepareGtag();
          setChoice(saved);
          return;
        }
      } catch { /* Storage may be unavailable; default to no analytics. */ }
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
    try { localStorage.setItem(CONSENT_KEY, next); } catch { /* Keep the choice for this visit. */ }
    if (next === "accepted") prepareGtag();
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
        <section aria-labelledby="analytics-consent-title" className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
          <div className="surface mx-auto max-w-3xl border-[var(--bronze-dim)] bg-[var(--surface)] p-5 shadow-2xl sm:p-6">
            <h2 id="analytics-consent-title" className="t-card">Analytics choice</h2>
            <p className="t-small mt-2 text-[var(--dim)]">
              May we use Google Analytics to understand visits and improve this site? It uses cookies and records quiz and affiliate-link interactions. The quiz works if you decline. Read more in{" "}
              <Link href="/methodology#privacy" className="link-bronze focus-ring">privacy and cookies</Link>.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button ref={declineRef} type="button" onClick={() => choose("declined")} className="btn-outline focus-ring">Decline analytics</button>
              <button type="button" onClick={() => choose("accepted")} className="btn focus-ring">Accept analytics</button>
              {settingsOpen && choice !== null && <button type="button" onClick={closeSettings} className="btn-quiet focus-ring">Cancel</button>}
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
