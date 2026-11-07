import type { PortableTextBlock } from "@portabletext/types";
export type Theme = "plum" | "rose" | "sage" | "gold" | "ivory";

export interface MediaAsset {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  category: "Music" | "Seniors Club" | "Celebrations";
  source: string;
  consent: "unconfirmed";
  publicationStatus: "published" | "draft";
  approval: "approved" | "pending" | "rejected";
  standaloneGallery: boolean;
  position?: string;
}

export interface Program {
  id: string;
  slug: string;
  previousSlugs?: string[];
  number: string;
  title: string;
  category: string;
  headline: string;
  description: string;
  paragraphs: string[];
  body?: PortableTextBlock[];
  focus: string[];
  imageId: string;
  imageContext: string;
  theme: Theme;
}

export interface CommunityEvent {
  id: string;
  slug: string;
  previousSlugs?: string[];
  title: string;
  date: string;
  dateLabel: string;
  status: "past" | "upcoming";
  location?: string;
  description: string;
  imageId: string;
  galleryIds: string[];
  sourceAlbum: string;
}

export interface JournalEntry {
  id: string;
  slug: string;
  previousSlugs?: string[];
  title: string;
  excerpt: string;
  paragraphs: string[];
  body?: PortableTextBlock[];
  status: "draft" | "published" | "unpublished";
  publishedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  kind: "event" | "update" | "news";
  eventId?: string;
  programIds: string[];
  photoIds: string[];
  showInGallery?: boolean;
  featuredOnHome?: boolean;
}

export interface GalleryCollection {
  id: string;
  title: string;
  photos: MediaAsset[];
  journalSlug?: string;
  journalId?: string;
}

export interface FAQ {
  question: string;
  answer: string;
  category: "About us" | "Taking part" | "Supporting us";
}

export interface SiteSettings {
  name: string;
  url: string;
  email: string;
  phone: string;
  location: string;
  mission: string;
  socialLinks?: { label: string; url: string }[];
}

export interface SiteContent {
  settings: SiteSettings;
  programs: Program[];
  events: CommunityEvent[];
  media: MediaAsset[];
  faqs: FAQ[];
  home: {
    featuredProgramSlugs: string[];
    featuredEventSlugs: string[];
    featuredStoryIds?: string[];
    heroImageId?: string;
    heroHeadline?: string;
    heroEmphasis?: string;
    heroDescription?: string;
    heroCtaLabel?: string;
    heroCtaHref?: string;
  };
}
