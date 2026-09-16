"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/gtag";

export default function ResultActions() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    trackEvent("result_share", { method: "copy" });
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={copy} className="btn focus-ring">{copied ? "Link copied" : "Copy link"}</button>
      <Link href="/" onClick={() => trackEvent("quiz_retake")} className="btn-outline focus-ring">Retake quiz</Link>
    </div>
  );
}
