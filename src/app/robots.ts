import type { MetadataRoute } from "next";
import { getSiteContent } from "@/lib/content";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const content = await getSiteContent();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${content.settings.url}/sitemap.xml`,
  };
}
