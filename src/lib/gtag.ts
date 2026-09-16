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
  }
}

export type EventParams = Record<string, string | number | boolean | undefined>;

function send(command: string, name: string, params: EventParams) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag(command, name, { ...params, transport_type: "beacon" });
}

export function trackEvent(name: string, params: EventParams = {}) {
  send("event", name, params);
}

export function trackPageView(measurementId: string, pathname: string) {
  send("event", "page_view", {
    send_to: measurementId,
    page_path: pathname,
    page_location: typeof window === "undefined" ? undefined : window.location.href,
    page_title: typeof document === "undefined" ? undefined : document.title,
  });
}
