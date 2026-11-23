import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getLiveTools } from "@/config/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const liveTools = getLiveTools();

  return [
    {
      url: siteConfig.url,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...liveTools.map((tool) => ({
      url: `${siteConfig.url}/${tool.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
