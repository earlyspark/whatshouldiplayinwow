import { isProductionDeployment } from "@/lib/deploy-env";
import ConsentManager from "./ConsentManager";

export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!isProductionDeployment()) return null;
  return <ConsentManager measurementId={measurementId} />;
}
