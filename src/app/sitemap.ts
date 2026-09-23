import type { MetadataRoute } from "next";
import { specs } from "@/data/specs";
import { specSlug } from "@/lib/pairings-params";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/pairings`, changeFrequency: "monthly", priority: 0.8 },
    ...specs.map((spec) => ({ url: `${siteUrl}/pairings/${specSlug(spec.id)}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${siteUrl}/methodology`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
