import type { Metadata } from "next";
import { content } from "@/data/content";
export function pageMetadata(
  title: string,
  description: string,
  path: string,
  image = "/assets/curated/community-picnic.webp",
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
