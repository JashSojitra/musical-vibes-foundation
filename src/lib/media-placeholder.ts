import type { MediaAsset } from "@/types/content";
/** Neutral layout placeholder; never substitutes a withdrawn photograph. */
export const unavailableMedia: MediaAsset = {
  id: "unavailable",
  src: "/assets/image-unavailable.svg",
  alt: "",
  width: 1200,
  height: 800,
  caption: "",
  category: "Seniors Club",
  source: "",
  consent: "unconfirmed",
  publicationStatus: "draft",
  approval: "pending",
  standaloneGallery: false,
};
