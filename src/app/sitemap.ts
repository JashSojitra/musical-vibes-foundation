import type { MetadataRoute } from "next";
import { getSiteContent } from "@/lib/content";
import { getPublicContent } from "@/lib/journal";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { settings, programs, events } = await getSiteContent();
  return [
    "",
    "/about",
    "/programs",
    "/events",
    "/gallery",
    "/updates",
    "/get-involved",
    "/contact",
    "/faq",
    ...programs.map((item) => `/programs/${item.slug}`),
    ...events.map((item) => `/events/${item.slug}`),
    ...(await getPublicContent())
      .getJournalEntries()
      .map((item) => `/updates/${item.slug}`),
  ].map((path) => ({
    url: settings.url + path,
    changeFrequency: "monthly" as const,
    priority: path ? 0.7 : 1,
  }));
}
