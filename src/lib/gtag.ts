import { redactedPageUrl } from "@/lib/analytics-url";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type EventParams = Record<string, string | number | boolean | undefined>;

/** Every `placement` an ad_click may report. Keep GA's buckets from splitting on a typo. */
export type AdPlacement =
  | "inline"
  | "sidebar"
  | "quiz_creator"
  | "result_creator_sidebar"
  | "not_found_creator";

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

export function errorRouteGroup(pathname: string) {
  if (/^\/result\/[^/]+\/?$/.test(pathname)) return "/result/[id]";
  if (pathname === "/" || pathname === "/methodology" || pathname === "/stats") return pathname;
  return "/other";
}

export function trackPageError(measurementId: string, errorType: "not_found" | "render_error") {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const pagePath = errorRouteGroup(window.location.pathname);
  window.gtag("event", "page_error", {
    send_to: measurementId,
    error_type: errorType,
    page_path: pagePath,
    page_location: new URL(pagePath, window.location.origin).toString(),
    page_title: errorType === "not_found" ? "Page not found" : "Page error",
    transport_type: "beacon",
  });
}
