"use client";

import { trackEvent } from "@/lib/gtag";

const VARIANTS = {
  full: {
    placement: "result_above_race",
    label: "Support the quiz creator",
    className: "mx-auto flex min-h-9 w-fit max-w-full gap-2 rounded-lg px-4 py-2 text-sm",
    iconClassName: "text-lg",
  },
  compact: {
    placement: "footer",
    label: "Buy me a coffee",
    className: "inline-flex gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs",
    iconClassName: "text-sm",
  },
} as const;

export default function SupportButton({
  fontClassName,
  variant = "full",
}: {
  fontClassName: string;
  variant?: keyof typeof VARIANTS;
}) {
  const { placement, label, className, iconClassName } = VARIANTS[variant];
  return (
    <a
      href="https://buymeacoffee.com/earlyspark"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("support_click", {
        placement,
        destination_host: "buymeacoffee.com",
      })}
      className={`focus-ring items-center justify-center bg-[#ffbb00] text-center leading-tight text-black no-underline transition-colors hover:bg-[#e5a800] ${className} ${fontClassName}`}
      style={{ color: "#000000" }}
    >
      <span className={iconClassName} aria-hidden="true">☕</span>
      <span>{label}</span>
    </a>
  );
}
