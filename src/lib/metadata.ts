import type { Metadata } from "next";
import type { CommunityEvent } from "@/types/content";
import { content } from "@/data/content";
export function pageMetadata(
  title: string,
  description: string,
  path: string,
  image = process.env.CONTENT_SOURCE === "sanity"
    ? "/assets/legacy/logo.png"
    : "/assets/curated/community-picnic.webp",
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | Musical Vibes Foundation`,
      description,
      url: path,
      type: "website",
      locale: "en_CA",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${content.settings.url}/#organization`,
  name: content.settings.name,
  url: content.settings.url,
  logo: `${content.settings.url}/assets/legacy/logo.png`,
  description: content.settings.mission,
  email: content.settings.email,
  telephone: content.settings.phone,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Brampton",
    addressRegion: "ON",
    addressCountry: "CA",
  },
};

/** Use only recorded facts; incomplete historical entries receive no Event markup. */
export function eventSchema(event: CommunityEvent, siteUrl: string) {
  if (!event.location?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(event.date))
    return null;
  const parsed = new Date(`${event.date}T00:00:00Z`);
  if (
    !Number.isFinite(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== event.date
  )
    return null;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.date,
    url: `${siteUrl.replace(/\/$/, "")}/events/${event.slug}`,
    location: { "@type": "Place", name: event.location },
  };
}
