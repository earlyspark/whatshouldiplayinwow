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
  | "not_found_creator"
  | "pairings_creator";

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
  window.gtag(command, name, { page_location: redactedPageUrl(window.location.href).toString(), ...params, transport_type: "beacon" });
}

export function trackEvent(name: string, params: EventParams = {}) {
  send("event", name, params);
}

// Next.js streams async generateMetadata titles after client navigations, so document.title is briefly empty.
const TITLE_WAIT_MS = 1000;

export function trackPageView(measurementId: string): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};
  const url = redactedPageUrl(window.location.href);
  const sendPageView = (title?: string) => send("event", "page_view", {
    send_to: measurementId,
    page_path: url.pathname,
    page_location: url.toString(),
    page_title: title || undefined,
  });

  if (document.title || typeof MutationObserver === "undefined") {
    sendPageView(document.title);
    return () => {};
  }

  let sent = false;
  const flush = (includeTitle: boolean) => {
    if (sent) return;
    sent = true;
    observer.disconnect();
    clearTimeout(timer);
    window.removeEventListener("pagehide", onPageHide);
    sendPageView(includeTitle ? document.title : undefined);
  };
  const onPageHide = () => flush(true);
  const observer = new MutationObserver(() => { if (document.title) flush(true); });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  const timer = setTimeout(() => flush(true), TITLE_WAIT_MS);
  window.addEventListener("pagehide", onPageHide);
  // A newer route's title must not be attributed to this path.
  return () => flush(false);
}

export function errorRouteGroup(pathname: string) {
  if (/^\/result\/[^/]+\/?$/.test(pathname)) return "/result/[id]";
  if (/^\/pairings\/[^/]+\/?$/.test(pathname)) return "/pairings/[spec]";
  if (pathname === "/" || pathname === "/pairings" || pathname === "/methodology" || pathname === "/stats") return pathname;
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
