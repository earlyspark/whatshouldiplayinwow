"use client";

import { useState } from "react";
import Link from "next/link";
import { withArticle } from "@/lib/article";
import { trackEvent } from "@/lib/gtag";

export default function ResultActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    trackEvent("result_share", { method: "copy" });
    window.setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title, text: `I should play ${withArticle(title)} in WoW Forever.`, url: window.location.href });
      trackEvent("result_share", { method: "native" });
    } catch { /* User cancelled the share sheet. */ }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={share} className="focus-ring min-h-12 cursor-pointer rounded-full bg-[var(--gold)] px-6 py-3 font-bold text-[#172022] hover:bg-[var(--gold-bright)]">Share result</button>
      <button onClick={copy} className="focus-ring min-h-12 cursor-pointer rounded-full border border-[var(--line)] px-6 py-3 font-bold hover:bg-white/5">{copied ? "Link copied" : "Copy link"}</button>
      <Link href="/#quiz" onClick={() => trackEvent("quiz_retake")} className="focus-ring inline-flex min-h-12 items-center rounded-full px-5 py-3 font-bold text-[var(--muted)] hover:text-white">Retake quiz</Link>
    </div>
  );
}
