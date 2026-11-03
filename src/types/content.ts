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
  position?: string;
}

export interface Program {
  slug: string;
  number: string;
  title: string;
  category: string;
  headline: string;
  description: string;
  paragraphs: string[];
  focus: string[];
  imageId: string;
  imageContext: string;
  theme: Theme;
}

export interface CommunityEvent {
  slug: string;
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
}

export interface SiteContent {
  settings: SiteSettings;
  programs: Program[];
  events: CommunityEvent[];
  media: MediaAsset[];
  faqs: FAQ[];
  home: { featuredProgramSlugs: string[]; featuredEventSlugs: string[] };
}
