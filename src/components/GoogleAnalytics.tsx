import ConsentManager from "./ConsentManager";

export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (process.env.VERCEL_ENV !== "production") return null;
  return <ConsentManager measurementId={measurementId} />;
}
