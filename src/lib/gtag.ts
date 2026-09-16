import { redactedPageUrl } from "@/lib/analytics-url";

/**
 * Google Analytics event helpers.
 *
 * gtag is only loaded on production deployments, so every call here is a no-op
 * during local development and on preview deployments. Hits use the beacon
 * transport so events queued while the page is unloading are not dropped.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type EventParams = Record<string, string | number | boolean | undefined>;

export function prepareGtag() {
  window.dataLayer ??= [];
  window.gtag ??= function gtag() {
    // Google tag expects an Arguments object in dataLayer, not a rest-parameter array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
}

function send(command: string, name: string, params: EventParams) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag(command, name, { ...params, page_location: redactedPageUrl(window.location.href).toString(), transport_type: "beacon" });
}

export function trackEvent(name: string, params: EventParams = {}) {
  send("event", name, params);
}

export function trackPageView(measurementId: string, pathname: string) {
  const safePath = typeof window === "undefined" ? pathname : redactedPageUrl(window.location.href).pathname;
  send("event", "page_view", {
    send_to: measurementId,
    page_path: safePath,
    page_title: typeof document === "undefined" ? undefined : document.title,
  });
}
