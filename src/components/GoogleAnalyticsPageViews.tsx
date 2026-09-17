"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/gtag";

export default function GoogleAnalyticsPageViews({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(measurementId, pathname);
  }, [measurementId, pathname]);

  return null;
}
