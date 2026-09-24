"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/gtag";

export default function GoogleAnalyticsPageViews({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();

  // pathname re-runs the effect on each client navigation.
  useEffect(() => trackPageView(measurementId), [measurementId, pathname]);

  return null;
}
