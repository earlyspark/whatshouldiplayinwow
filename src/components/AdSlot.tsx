"use client";

import { trackEvent } from "@/lib/gtag";

const SHOW_EMPTY_PLACEHOLDER = false;

interface AdSlotProps {
  placement: "sidebar" | "inline";
  href?: string;
  headline?: string;
  body?: string;
}

export default function AdSlot({ placement, href, headline, body }: AdSlotProps) {
  const size = placement === "sidebar" ? "min-h-[250px] lg:min-h-[300px]" : "min-h-[110px]";
  const trackClick = () => {
    if (!href) return;
    trackEvent("ad_click", {
      placement,
      destination_host: new URL(href, window.location.href).hostname,
    });
  };

  // Empty "Reserved ad space" boxes read as low-value content to ad reviewers; true shows them again.
  if (!SHOW_EMPTY_PLACEHOLDER && !(href && headline)) return null;

  return (
    <aside className={`${size} flex w-full items-center justify-center border border-dashed border-[var(--line)] p-5 text-center`} aria-label="Advertisement">
      {href && headline ? (
        <a href={href} target="_blank" rel="sponsored nofollow noopener" onClick={trackClick} className="focus-ring t-small">
          <span className="t-label block text-[var(--dim)]">Advertisement</span>
          <strong className="t-card mt-3 block text-[var(--bronze)]">{headline}</strong>
          {body && <span className="t-small mt-2 block text-[var(--dim)]">{body}</span>}
        </a>
      ) : (
        <div>
          <span className="t-label block text-[var(--dim)]">Advertisement</span>
          <span className="t-small mt-2 block text-[var(--dim)]">Reserved ad space</span>
        </div>
      )}
    </aside>
  );
}
