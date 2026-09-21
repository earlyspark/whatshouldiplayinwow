"use client";

import { trackEvent } from "@/lib/gtag";

const ETSY_LISTING_URL = "https://earlyspark.etsy.com/listing/1081948944";

export default function CreatorShopLink({ children, placement }: { children: React.ReactNode; placement: string }) {
  return (
    <a
      href={ETSY_LISTING_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("ad_click", {
        placement,
        destination_host: "etsy.com",
        item_id: "1081948944",
      })}
      className="focus-ring group flex min-w-0 flex-col gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[.04]"
    >
      {children}
    </a>
  );
}
