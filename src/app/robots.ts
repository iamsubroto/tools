import type { MetadataRoute } from "next";
import { isPreviewDeployment, siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeployment) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
