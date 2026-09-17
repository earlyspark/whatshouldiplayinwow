import AnalyticsConsent from "./AnalyticsConsent";

export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (process.env.VERCEL_ENV !== "production" || !measurementId) return null;
  return <AnalyticsConsent measurementId={measurementId} />;
}
