import Script from "next/script";
import GoogleAnalyticsPageViews from "./GoogleAnalyticsPageViews";

/**
 * Loads Google Analytics on production deployments only.
 *
 * VERCEL_ENV is "production" solely on production deployments, so local
 * development and preview deployments render nothing and send no hits. The
 * measurement ID is public but read from the environment so the property can
 * be changed or removed without editing code.
 *
 * Automatic page views are disabled because quiz completion reaches the result
 * page through a client-side navigation. GoogleAnalyticsPageViews sends exactly
 * one page view per route instead, covering both initial loads and in-app
 * navigation without double counting.
 */
export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (process.env.VERCEL_ENV !== "production" || !measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', { send_page_view: false });`}
      </Script>
      <GoogleAnalyticsPageViews measurementId={measurementId} />
    </>
  );
}
