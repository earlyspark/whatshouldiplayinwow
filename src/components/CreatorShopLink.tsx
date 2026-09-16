"use client";

import { trackEvent } from "@/lib/gtag";

const ETSY_LISTING_URL = "https://www.etsy.com/listing/1081948944/sinister-squashling-framed-watercolor";

export default function CreatorShopLink() {
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
      className="focus-ring mt-5 inline-flex min-h-11 w-full items-center justify-center border border-[var(--bronze)] px-4 py-2 text-center text-sm font-semibold text-[var(--bone)] transition-colors hover:bg-[rgba(200,150,74,.12)]"
    >
      See the print on Etsy <span aria-hidden="true" className="ml-2">↗</span>
    </a>
  );
}
