"use client";

import { trackEvent } from "@/lib/gtag";

export default function SupportButton({ fontClassName }: { fontClassName: string }) {
  return (
    <a
      href="https://buymeacoffee.com/earlyspark"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("support_click", {
        placement: "result_above_race",
        destination_host: "buymeacoffee.com",
      })}
      className={`focus-ring mx-auto flex min-h-9 w-fit max-w-full items-center justify-center gap-2 rounded-lg bg-[#ffbb00] px-4 py-2 text-center text-sm leading-tight text-black no-underline transition-colors hover:bg-[#e5a800] ${fontClassName}`}
      style={{ color: "#000000" }}
    >
      <span className="text-lg" aria-hidden="true">☕</span>
      <span>Support the quiz creator</span>
    </a>
  );
}
