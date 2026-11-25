import type { MediaAsset } from "../types/content";

export type TimelineGroup = { date?: string; photos: MediaAsset[] };
export type TimelineFrame = {
  key: string;
  photo: MediaAsset;
  date?: string;
  index: number;
};
export type TimelineMonth = {
  key: string;
  year: number | null;
  label: string;
  shortLabel: string;
  groups: TimelineGroup[];
  photoCount: number;
  featured: TimelineFrame[];
};

const longMonth = new Intl.DateTimeFormat("en-CA", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortMonth = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  timeZone: "UTC",
});

export const monthKeyFor = (date?: string) => date?.slice(0, 7) ?? "undated";

export function timelineMonths(
  groups: TimelineGroup[],
  limit = 8,
): TimelineMonth[] {
  const byMonth = new Map<string, TimelineGroup[]>();
  for (const group of groups) {
    if (!group.photos.length) continue;
    const key = monthKeyFor(group.date);
    const list = byMonth.get(key) ?? [];
    list.push(group);
    byMonth.set(key, list);
  }

  return [...byMonth].map(([key, groups]) => {
    const date = key === "undated" ? null : new Date(`${key}-01T12:00:00Z`);
    const photoCount = groups.reduce(
      (count, group) => count + group.photos.length,
      0,
    );
    const count = Math.min(photoCount, limit);
    // Spread Craft's featured picks across the month in archive order.
    const featured: TimelineFrame[] = [];
    let offset = 0;
    for (const group of groups) {
      while (featured.length < count) {
        const index =
          count === 1
            ? 0
            : Math.round((featured.length * (photoCount - 1)) / (count - 1));
        if (index >= offset + group.photos.length) break;
        const photo = group.photos[index - offset];
        featured.push({
          key: `${group.date ?? key}:${photo.id}:${index}`,
          photo,
          date: group.date,
          index,
        });
      }
      offset += group.photos.length;
    }

    return {
      key,
      year: date?.getUTCFullYear() ?? null,
      label: date ? longMonth.format(date) : "Date unrecorded",
      shortLabel: date ? shortMonth.format(date) : "Undated",
      groups,
      photoCount,
      featured,
    };
  });
}

/** Craft's rail uses calendar distance, leaving space between sparse months. */
export function timelineStops(months: TimelineMonth[]): number[] {
  const dated = months.filter((month) => month.year !== null);
  const ordinal = (key: string) =>
    Number(key.slice(0, 4)) * 12 + Number(key.slice(5));
  if (!dated.length) return months.map(() => 0);
  const newest = ordinal(dated[0].key);
  const span =
    newest -
    ordinal(dated[dated.length - 1].key) +
    Number(months.length > dated.length);
  return months.map((month) =>
    month.year === null ? 1 : span ? (newest - ordinal(month.key)) / span : 0,
  );
}

/** Rail fraction for a continuous stop position (e.g. 2.4 → 40% of the way from stop 2 to 3). */
export function fractionAt(stops: number[], pos: number): number {
  if (stops.length <= 1) return 0;
  const p = Math.min(Math.max(pos, 0), stops.length - 1);
  const i = Math.min(Math.floor(p), stops.length - 2);
  return stops[i] + (stops[i + 1] - stops[i]) * (p - i);
}

/** Inverse of fractionAt: continuous stop position for a rail fraction. */
export function positionAt(stops: number[], fraction: number): number {
  if (stops.length <= 1) return 0;
  const f = Math.min(Math.max(fraction, stops[0]), stops[stops.length - 1]);
  for (let i = 0; i < stops.length - 1; i++) {
    if (f <= stops[i + 1])
      return (
        i +
        (stops[i + 1] === stops[i]
          ? 0
          : (f - stops[i]) / (stops[i + 1] - stops[i]))
      );
  }
  return stops.length - 1;
}
