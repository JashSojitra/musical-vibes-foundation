import { test } from "node:test";
import assert from "node:assert/strict";
import { timelineMonths, timelineStops } from "../src/lib/archive-months";
import { mediaAssets } from "../src/data/media";
import {
  eventDate,
  localArchiveAlbums,
  timelineGroups,
} from "../src/lib/archive";

test("original event dates group and order the same curated assets without duplicate binaries", () => {
  const albums = localArchiveAlbums(mediaAssets);
  const repeated = {
    ...albums[0],
    id: "duplicate",
    photos: [albums[0].photos[0]],
  };
  const groups = timelineGroups([...albums.reverse(), repeated], mediaAssets);
  const dates = groups.map((group) => group.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.equal(dates[0], "2025-12-08");
  assert.ok(dates.includes("2025-01-15"));
  const photos = groups.flatMap((group) => group.photos);
  assert.equal(photos.length, mediaAssets.length);
  assert.equal(
    new Set(photos.map((photo) => photo.src)).size,
    mediaAssets.length,
  );
  assert.equal(photos[0].archive?.folder, "25_12_8_Seniors_Club");
  assert.equal(photos[0].consent, "unconfirmed");
});

test("calendar dates reject rollover and undated photos remain accessible", () => {
  assert.equal(eventDate("2025-02-29"), undefined);
  assert.equal(eventDate("2024-02-29"), "2024-02-29");
  assert.deepEqual(timelineGroups([], [mediaAssets[0], mediaAssets[0]]), [
    { date: undefined, photos: [mediaAssets[0]] },
  ]);
});

test("month stops preserve event dates, including reuse across dates, and bound featured picks", () => {
  const album = localArchiveAlbums(mediaAssets)[0];
  const groups = timelineGroups(
    [
      { ...album, date: "2024-02-29", photos: mediaAssets.slice(0, 10) },
      { ...album, date: "2024-02-01", photos: [mediaAssets[0]] },
      { ...album, date: "2024-08-01", photos: [mediaAssets[0]] },
      { ...album, date: "2024-05-01", photos: [mediaAssets[0]] },
    ],
    [],
  );
  const months = timelineMonths(groups, 4);
  assert.deepEqual(
    months.map(({ key }) => key),
    ["2024-08", "2024-05", "2024-02"],
  );
  assert.deepEqual(timelineStops(months), [0, 0.5, 1]);
  assert.equal(months[2].photoCount, 11);
  assert.deepEqual(
    months[2].featured.map(({ index }) => index),
    [0, 3, 7, 10],
  );
  assert.equal(months[2].featured[3].date, "2024-02-01");
  assert.equal(
    months[0].featured[0].photo.originalSrc,
    months[2].featured[0].photo.originalSrc,
  );
});
