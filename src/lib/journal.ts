import { content } from "@/data/content";
import type {
  GalleryCollection,
  JournalEntry,
  MediaAsset,
  SiteContent,
} from "@/types/content";

/** Archive migration notes, not invented current news or backdated publication. */
export const journalSeed: JournalEntry[] = content.events
  .filter((event) => event.status === "past")
  .map((event) => ({
    id: `journal.${event.id}`,
    slug: event.slug,
    title: event.title,
    excerpt: event.description,
    paragraphs: [
      event.description,
      `These photographs are preserved from the foundation’s original website archive, in the album “${event.sourceAlbum}”.`,
    ],
    status: "published",
    publishedAt: "2026-11-03",
    kind: "event",
    eventId: event.id,
    programIds: [
      "program.senior-engagement-activities",
      ...(event.id === "event.diwali-celebrations-2025"
        ? ["program.healing-through-music"]
        : []),
    ],
    photoIds: event.galleryIds,
  }));

export const isPublicMedia = (photo: MediaAsset) =>
  photo.publicationStatus === "published" && photo.approval === "approved";
export const isPublishedEntry = (
  entry: JournalEntry,
  today = new Date().toISOString().slice(0, 10),
) =>
  entry.status === "published" &&
  /^\d{4}-\d{2}-\d{2}$/.test(entry.publishedAt) &&
  Number.isFinite(Date.parse(`${entry.publishedAt}T12:00:00Z`)) &&
  entry.publishedAt <= today;

/** Pure projection: no Gallery image copies and no persisted derived collection records. */
export function deriveGalleryCollections(
  entries: JournalEntry[],
  media: MediaAsset[],
  today?: string,
): GalleryCollection[] {
  const publicMedia = new Map(
    media.filter(isPublicMedia).map((photo) => [photo.id, photo]),
  );
  return entries
    .filter(
      (entry) =>
        isPublishedEntry(entry, today) &&
        entry.kind === "event" &&
        !!entry.eventId,
    )
    .flatMap((entry) => {
      const photos = [...new Set(entry.photoIds)].flatMap((id) =>
        publicMedia.has(id) ? [publicMedia.get(id)!] : [],
      );
      return photos.length
        ? [
            {
              id: `journal-collection.${entry.id}`,
              title: entry.title,
              photos,
              journalId: entry.id,
              journalSlug: entry.slug,
            },
          ]
        : [];
    });
}

export function createContentAdapter(
  source: SiteContent,
  entries: JournalEntry[],
  today = new Date().toISOString().slice(0, 10),
) {
  const publicEntries = entries
    .filter((entry) => isPublishedEntry(entry, today))
    .sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id),
    );
  const eligiblePhotos = source.media.filter(isPublicMedia);
  const photoById = new Map(eligiblePhotos.map((photo) => [photo.id, photo]));
  const collections = deriveGalleryCollections(entries, source.media, today);
  const standalone = eligiblePhotos.filter((photo) => photo.standaloneGallery);
  const galleryIds = new Set(
    [
      ...standalone,
      ...collections.flatMap((collection) => collection.photos),
    ].map((photo) => photo.id),
  );
  const photos = eligiblePhotos.filter((photo) => galleryIds.has(photo.id));
  // Keep the existing archive as an explicit standalone collection using the same references.
  if (standalone.length)
    collections.push({
      id: "standalone.community-archive",
      title: "The community archive",
      photos: standalone,
    });
  return {
    getJournalEntries: () => publicEntries,
    getJournalEntry: (slug: string) =>
      publicEntries.find((entry) => entry.slug === slug),
    getGalleryCollections: () => collections,
    getPublicPhotos: () => photos,
    getEntryPhotos: (entry: JournalEntry) =>
      !isPublishedEntry(entry, today)
        ? []
        : [...new Set(entry.photoIds)].flatMap((id) =>
            photoById.has(id) ? [photoById.get(id)!] : [],
          ),
    getEntryPrograms: (entry: JournalEntry) =>
      source.programs.filter((program) =>
        entry.programIds.includes(program.id),
      ),
    getEntryEvent: (entry: JournalEntry) =>
      source.events.find((event) => event.id === entry.eventId),
  };
}
export const getPublicContent = () =>
  createContentAdapter(content, journalSeed);
export const journalDate = (date: string) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
