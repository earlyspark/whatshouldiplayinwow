"use client";

import { trackEvent } from "@/lib/gtag";

interface AmazonProductLinkProps {
  href: string;
  asin: string;
  category?: string;
  placement: string;
  className?: string;
  children: React.ReactNode;
}

export default function AmazonProductLink({ href, asin, category, placement, className, children }: AmazonProductLinkProps) {
  const trackClick = () => {
    trackEvent("ad_click", { placement, destination_host: "amazon", item_id: asin, category });
  };

  return (
    <a href={href} target="_blank" rel="sponsored nofollow noopener" onClick={trackClick} className={className}>
      {children}
    </a>
  );
}
