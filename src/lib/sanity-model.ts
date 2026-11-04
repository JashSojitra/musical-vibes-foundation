import { createImageUrlBuilder } from "@sanity/image-url";
import type { PortableTextBlock } from "@portabletext/types";
import type { JournalEntry, SiteContent, MediaAsset } from "../types/content";

export interface CmsDocument {
  _id: string;
  _type: string;
  sourceId?: string;
  slug?: { current: string };
  previousSlugs?: string[];
  title?: string;
  [key: string]: unknown;
}
export const publicDocument = (d: CmsDocument) =>
  !d._id.startsWith("drafts.") && !d._id.startsWith("versions.");
const ref = (value: unknown) => (value as { _ref?: string } | undefined)?._ref;
const refs = (value: unknown) =>
  ((value as unknown[]) ?? []).flatMap((v) => (ref(v) ? [ref(v)!] : []));
const text = (d: CmsDocument, key: string) =>
  typeof d[key] === "string" ? (d[key] as string) : "";
const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
const body = (d: CmsDocument) =>
  (Array.isArray(d.body) ? d.body : []) as PortableTextBlock[];
const paragraphs = (d: CmsDocument) =>
  body(d).map((b) => b.children?.map((c) => c.text).join("") ?? "");

/** Published snapshot only. Missing, draft and broken references fail closed. */
export function mapSanity(
  documents: CmsDocument[],
  projectId: string,
  dataset: string,
) {
  const docs = documents.filter(publicDocument);
  const identities = new Map(docs.map((d) => [d._id, d.sourceId || d._id]));
  const resolve = (value: unknown) => identities.get(ref(value) ?? "");
  const resolveMany = (value: unknown) =>
    refs(value).flatMap((id) =>
      identities.has(id) ? [identities.get(id)!] : [],
    );
  const builder = createImageUrlBuilder({ projectId, dataset });
  const media: MediaAsset[] = docs
    .filter((d) => d._type === "mediaItem")
    .flatMap((d) => {
      const image = d.image as
        | { asset?: { _ref?: string }; hotspot?: { x: number; y: number } }
        | undefined;
      const match = image?.asset?._ref?.match(
        /^image-[a-zA-Z0-9]+-(\d+)x(\d+)-[a-zA-Z0-9]+$/,
      );
      if (
        !match ||
        d.assetExists === false ||
        d.editorialApproval !== "approved" ||
        d.publicationEnabled !== true ||
        !text(d, "alt")
      )
        return [];
      return [
        {
          id: d.sourceId || d._id,
          src: builder
            .image(image!)
            .width(Math.min(1920, Number(match[1])))
            .fit("max")
            .auto("format")
            .url(),
          width: Number(match[1]),
          height: Number(match[2]),
          alt: text(d, "alt"),
          caption: text(d, "caption"),
          category: (d.category || "Seniors Club") as MediaAsset["category"],
          source: text(d, "source"),
          consent: "unconfirmed",
          approval: "approved",
          publicationStatus: "published",
          standaloneGallery: d.standaloneGallery === true,
          position: image?.hotspot
            ? `${image.hotspot.x * 100}% ${image.hotspot.y * 100}%`
            : text(d, "position"),
        },
      ];
    });
  const imageIds = new Set(media.map((m) => m.id));
  const settings = docs.find(
    (d) => d._id === "siteSettings" && d._type === "siteSettings",
  );
  if (!settings)
    throw new Error(
      "Sanity siteSettings singleton is missing. Run and verify the migration before selecting Sanity.",
    );
  const programs: SiteContent["programs"] = docs
    .filter((d) => d._type === "program" && d.slug?.current)
    .map((d) => ({
      id: d.sourceId || d._id,
      slug: d.slug!.current,
      previousSlugs: strings(d.previousSlugs),
      title: text(d, "title"),
      number: text(d, "number"),
      category: text(d, "category"),
      headline: text(d, "headline"),
      description: text(d, "description"),
      paragraphs: paragraphs(d),
      body: body(d),
      focus: strings(d.focus),
      imageId: resolve(d.image) || "",
      imageContext: text(d, "imageContext"),
      theme: (d.theme || "ivory") as SiteContent["programs"][number]["theme"],
    }));
  const events: SiteContent["events"] = docs
    .filter((d) => d._type === "event" && d.slug?.current)
    .map((d) => ({
      id: d.sourceId || d._id,
      slug: d.slug!.current,
      previousSlugs: strings(d.previousSlugs),
      title: text(d, "title"),
      date: text(d, "date"),
      dateLabel: text(d, "dateLabel") || text(d, "date"),
      status: d.status === "upcoming" ? "upcoming" : "past",
      location: text(d, "location"),
      description: text(d, "description"),
      imageId: resolve(d.image) || "",
      galleryIds: resolveMany(d.gallery).filter((id) => imageIds.has(id)),
      sourceAlbum: text(d, "sourceAlbum"),
    }));
  const entries: JournalEntry[] = docs
    .filter((d) => d._type === "journalEntry" && d.slug?.current)
    .map((d) => ({
      id: d.sourceId || d._id,
      slug: d.slug!.current,
      previousSlugs: strings(d.previousSlugs),
      title: text(d, "title"),
      excerpt: text(d, "excerpt"),
      paragraphs: paragraphs(d),
      body: body(d),
      seoTitle: text(d, "seoTitle"),
      seoDescription: text(d, "seoDescription"),
      status: "published",
      publishedAt: text(d, "publishedAt"),
      kind: d.kind as JournalEntry["kind"],
      eventId: events.find((e) => e.id === resolve(d.event))?.id,
      programIds: resolveMany(d.programs).filter((id) =>
        programs.some((p) => p.id === id),
      ),
      photoIds: resolveMany(d.photos).filter((id) => imageIds.has(id)),
    }));
  const source: SiteContent = {
    settings: {
      name: text(settings, "name"),
      url: text(settings, "url"),
      email: text(settings, "email"),
      phone: text(settings, "phone"),
      location: text(settings, "location"),
      mission: text(settings, "mission"),
      socialLinks:
        settings.socialLinks as SiteContent["settings"]["socialLinks"],
    },
    programs,
    events,
    media,
    faqs: docs
      .filter((d) => d._type === "faq")
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
      .map((d) => ({
        question: text(d, "question"),
        answer: text(d, "answer"),
        category: d.category as SiteContent["faqs"][number]["category"],
      })),
    home: {
      featuredProgramSlugs: resolveMany(settings.featuredPrograms).flatMap(
        (id) => programs.filter((p) => p.id === id).map((p) => p.slug),
      ),
      featuredEventSlugs: resolveMany(settings.featuredEvents).flatMap((id) =>
        events.filter((e) => e.id === id).map((e) => e.slug),
      ),
    },
  };
  return { source, entries };
}
