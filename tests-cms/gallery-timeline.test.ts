import { test } from "node:test";
import assert from "node:assert/strict";
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
