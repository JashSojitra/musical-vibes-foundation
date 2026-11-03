import type { MetadataRoute } from "next";
import { content } from "@/data/content";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${content.settings.url}/sitemap.xml`,
  };
}
