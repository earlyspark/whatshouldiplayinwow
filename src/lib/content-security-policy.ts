/** Static-page CSP: Next's inline hydration scripts require unsafe-inline. */
export function contentSecurityPolicy(isDevelopment: boolean) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://wow.zamimg.com https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline' https://wow.zamimg.com",
    "img-src 'self' data: blob: https://m.media-amazon.com https://images-na.ssl-images-amazon.com https://wow.zamimg.com https://*.wowhead.com https://www.google-analytics.com",
    "font-src 'self' data: https://wow.zamimg.com",
    "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://www.wowhead.com https://nether.wowhead.com https://wow.zamimg.com https://vitals.vercel-insights.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
