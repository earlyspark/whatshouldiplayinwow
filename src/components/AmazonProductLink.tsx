"use client";

import { trackEvent } from "@/lib/gtag";

interface AmazonProductLinkProps {
  href: string;
  asin: string;
  placement: "sidebar" | "inline";
  className?: string;
  children: React.ReactNode;
}

/**
 * Click-tracked affiliate link. The href comes from Amazon's detailPageURL, so
 * the partner tag is already attached and must not be rewritten.
 */
export default function AmazonProductLink({ href, asin, placement, className, children }: AmazonProductLinkProps) {
  const trackClick = () => {
    trackEvent("ad_click", { placement, destination_host: "amazon", item_id: asin });
  };

  return (
    <a href={href} target="_blank" rel="sponsored nofollow noopener" onClick={trackClick} className={className}>
      {children}
    </a>
  );
}
