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
      <button onClick={share} className="btn focus-ring">Share result</button>
      <button onClick={copy} className="btn-outline focus-ring">{copied ? "Link copied" : "Copy link"}</button>
      <Link href="/#quiz" onClick={() => trackEvent("quiz_retake")} className="btn-quiet focus-ring">Retake quiz</Link>
    </div>
  );
}
