"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/gtag";

/**
 * Sends one Google Analytics page view per route.
 *
 * The gtag config disables automatic page views, so this covers the first load
 * and every client-side navigation alike, including the push to the result page
 * after the quiz is submitted.
 */
export default function GoogleAnalyticsPageViews({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(measurementId, pathname);
  }, [measurementId, pathname]);

  return null;
}
