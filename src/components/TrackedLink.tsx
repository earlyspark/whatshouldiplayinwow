"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/gtag";

export default function TrackedLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={className}
      // GA's enhanced measurement only sends "click" for outbound links; same-site links report it here so both share one report.
      onClick={() => trackEvent("click", {
        link_url: new URL(href, window.location.origin).toString(),
        link_domain: window.location.hostname,
        outbound: false,
      })}
    >
      {children}
    </Link>
  );
}
