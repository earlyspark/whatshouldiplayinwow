import { ADSENSE_ENABLED } from "./ad-consent";

/** Static-page CSP: Next's inline hydration scripts require unsafe-inline. */
export function contentSecurityPolicy(isDevelopment: boolean, adsEnabled = ADSENSE_ENABLED) {
  const ads = (sources: string) => adsEnabled ? ` ${sources}` : "";
  // Google Analytics can also use *.google.com and *.doubleclick.net, so those stay when AdSense is off.
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com${ads("https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com")} https://*.google.com${ads("https://*.googleadservices.com https://*.adtrafficquality.google")} https://wow.zamimg.com https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline' https://wow.zamimg.com",
    `img-src 'self' data: blob: https://m.media-amazon.com https://images-na.ssl-images-amazon.com https://wow.zamimg.com https://*.wowhead.com https://www.google-analytics.com${ads("https://*.googlesyndication.com")} https://*.doubleclick.net${ads("https://*.adtrafficquality.google")} https://*.google.com`,
    "font-src 'self' data: https://wow.zamimg.com",
    `connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com${ads("https://*.googlesyndication.com")} https://*.doubleclick.net${ads("https://fundingchoicesmessages.google.com https://*.adtrafficquality.google")} https://*.google.com https://www.wowhead.com https://nether.wowhead.com https://wow.zamimg.com https://cloudflareinsights.com`,
    ...(adsEnabled ? ["frame-src https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://*.google.com"] : []),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
