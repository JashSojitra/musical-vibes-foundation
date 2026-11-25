import index from "../data/archive-index.json";
import type { GalleryCollection, MediaAsset } from "../types/content";
import type { TimelineGroup } from "./archive-months";

const origin = "https://www.musicalvibesfoundation.com/assets/";
const indexedAlbums = new Map(index.map((album) => [album.id, album]));

export function eventDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d\d-\d\d$/.test(value)) return undefined;
  const parsed = new Date(value);
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

export const archiveTitle = (title: string) =>
  title.replace(/ \([^()]+\)$/, "").replaceAll("_", " ");

export function legacyAlbum(id: string) {
  return indexedAlbums.get(id);
}

export function legacyPosition(
  album: NonNullable<ReturnType<typeof legacyAlbum>>,
  asset: string | undefined,
  key: unknown,
) {
  const hash = asset?.split("-")[1];
  if (!hash) return undefined;
  const order =
    typeof key === "string" && /^position-\d+$/.test(key)
      ? Number(key.slice("position-".length))
      : -1;
  const indexed = album.photos[order];
  if (indexed?.[1] === hash) return indexed[0] ?? undefined;
  const matches = album.photos.filter(([, sha1]) => sha1 === hash);
  return matches.length === 1 ? (matches[0][0] ?? undefined) : undefined;
}

export function archivePhoto(
  photo: MediaAsset,
  album: NonNullable<ReturnType<typeof legacyAlbum>>,
  path: string,
): MediaAsset {
  return {
    ...photo,
    archive: {
      folder: path.split("/")[0],
      title: album.title,
      eventDate: album.date,
      source: new URL(path, origin).href,
    },
  };
}

export function archiveCategory(
  title: string,
  photos: MediaAsset[],
): MediaAsset["category"] {
  if (/christmas|diwali/i.test(title)) return "Celebrations";
  if (/tribute/i.test(title)) return "Music";
  return photos[0]?.category ?? "Seniors Club";
}

/** Project existing curated records into their original folders in local mode. */
export function localArchiveAlbums(media: MediaAsset[]): GalleryCollection[] {
  const bySource = new Map(media.map((photo) => [photo.source, photo]));
  return index.flatMap((album) => {
    const photos = album.photos.flatMap(([path]) => {
      const photo = path ? bySource.get(new URL(path, origin).href) : undefined;
      return path && photo ? [archivePhoto(photo, album, path)] : [];
    });
    return photos.length
      ? [
          {
            id: album.id,
            title: archiveTitle(album.title),
            date: album.date,
            category: archiveCategory(album.title, photos),
            photos,
          },
        ]
      : [];
  });
}

export const photoIdentity = (photo: MediaAsset) =>
  photo.originalSrc ?? photo.src;

export function timelineGroups(
  collections: GalleryCollection[],
  photos: MediaAsset[],
): TimelineGroup[] {
  const byDate = new Map<string, Map<string, MediaAsset>>();
  const datedAssets = new Set<string>();
  const undatedAlbumPhotos: MediaAsset[] = [];
  for (const album of collections) {
    const date = eventDate(album.date);
    if (!date) {
      undatedAlbumPhotos.push(...album.photos);
      continue;
    }
    const group = byDate.get(date) ?? new Map<string, MediaAsset>();
    for (const photo of album.photos) {
      const key = photoIdentity(photo);
      datedAssets.add(key);
      if (!group.has(key)) group.set(key, photo);
    }
    byDate.set(date, group);
  }

  const seen = new Set<string>();
  const undated = [
    ...undatedAlbumPhotos,
    ...photos.filter((photo) => !datedAssets.has(photoIdentity(photo))),
  ].filter((photo) => {
    const key = photoIdentity(photo);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [
    ...Array.from(byDate.keys())
      .sort()
      .reverse()
      .map((date) => ({ date, photos: [...byDate.get(date)!.values()] })),
    ...(undated.length ? [{ date: undefined, photos: undated }] : []),
  ];
}
