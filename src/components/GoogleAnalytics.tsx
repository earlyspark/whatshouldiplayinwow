import Script from "next/script";

/**
 * Loads Google Analytics on production deployments only.
 *
 * VERCEL_ENV is "production" solely on production deployments, so local
 * development and preview deployments render nothing and never send hits. The
 * measurement ID is public but read from the environment so the property can
 * be changed or removed without editing code.
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
gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}
