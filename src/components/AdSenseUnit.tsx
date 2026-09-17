"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { AD_CONSENT_CHANGED_EVENT, AD_CONSENT_KEY, ADSENSE_CLIENT } from "@/lib/ad-consent";

const SLOT = "3425545545";

declare global {
  interface Window { adsbygoogle?: unknown[]; }
}

export default function AdSenseUnit({ viewport }: { viewport?: "mobile" | "desktop" }) {
  const [allowed, setAllowed] = useState(false);
  const [preview, setPreview] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [visibleAtViewport, setVisibleAtViewport] = useState(!viewport);
  const requested = useRef(false);

  useEffect(() => {
    if (!viewport) return;
    const query = window.matchMedia(viewport === "desktop" ? "(min-width: 1024px)" : "(max-width: 1023px)");
    const update = () => setVisibleAtViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [viewport]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("previewAds")) {
      const frame = window.requestAnimationFrame(() => setPreview(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const check = () => {
      try { setAllowed(localStorage.getItem(AD_CONSENT_KEY) === "accepted"); }
      catch { setAllowed(false); }
    };
    window.addEventListener(AD_CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(AD_CONSENT_CHANGED_EVENT, check);
  }, []);

  useEffect(() => {
    if (!visibleAtViewport || preview || !allowed || !scriptReady || requested.current) return;
    requested.current = true;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
    catch { requested.current = false; }
  }, [allowed, preview, scriptReady, visibleAtViewport]);

  if (!visibleAtViewport || (!allowed && !preview)) return null;
  return <aside className={`${preview ? "surface p-4" : "adsense-unit"} mx-auto mt-5 w-full max-w-[340px]`} aria-label="Advertisement">
    <span className="adsense-label t-label block text-[var(--dim)]">Advertisement</span>
    {preview ? <div className="mt-3 flex aspect-square w-full items-center justify-center border border-dashed border-[var(--line)] p-4 text-center text-sm text-[var(--dim)]">Responsive square ad preview · actual ad content and size may vary</div> : <>
    <Script src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} strategy="afterInteractive" crossOrigin="anonymous" onReady={() => setScriptReady(true)} />
    <ins className="adsbygoogle block min-h-[250px] w-full" data-ad-client={ADSENSE_CLIENT} data-ad-slot={SLOT} data-ad-format="rectangle" data-full-width-responsive="false" />
    </>}
  </aside>;
}
