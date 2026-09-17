"use client";

import { trackEvent } from "@/lib/gtag";

const ETSY_LISTING_URL = "https://www.etsy.com/listing/1081948944/sinister-squashling-framed-watercolor";

export default function CreatorShopLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={ETSY_LISTING_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("ad_click", {
        placement: "result_creator_sidebar",
        destination_host: "etsy.com",
        item_id: "1081948944",
      })}
      className="focus-ring group flex min-w-0 flex-col gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[.04]"
    >
      {children}
    </a>
  );
}
