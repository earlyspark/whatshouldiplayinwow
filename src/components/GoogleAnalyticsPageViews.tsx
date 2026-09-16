"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Sends one Google Analytics page view per route.
 *
 * The gtag config disables automatic page views, so this covers the first load
 * and every client-side navigation alike. The effect runs after the analytics
 * scripts load; if gtag is not ready yet the hit is skipped rather than queued,
 * because the following navigation sends the current route anyway.
 */
export default function GoogleAnalyticsPageViews({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      send_to: measurementId,
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [measurementId, pathname]);

  return null;
}
