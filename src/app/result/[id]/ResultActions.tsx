"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/gtag";

export default function ResultActions() {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState("");

  const copy = async () => {
    setFeedback("");
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setFeedback("Link copied to clipboard.");
      trackEvent("result_share", { method: "copy" });
      window.setTimeout(() => { setCopied(false); setFeedback(""); }, 1800);
    } catch {
      setCopied(false);
      setFeedback("Could not copy the link. Select the address in your browser to share it.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button onClick={copy} className="btn focus-ring">{copied ? "Link copied" : "Copy link"}</button>
        <Link href="/" onClick={() => trackEvent("quiz_retake")} className="btn-outline focus-ring">Retake quiz</Link>
      </div>
      <p role="status" aria-live="polite" className={feedback && !copied ? "t-small mt-2 text-[var(--dim)]" : "sr-only"}>{feedback}</p>
    </div>
  );
}
