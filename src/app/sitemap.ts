import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/pairings`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/methodology`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
