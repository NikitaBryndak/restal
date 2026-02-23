import type { MetadataRoute } from "next";
import { BASE_URL } from "@/config/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
