import { test } from "node:test";
import assert from "node:assert/strict";
import { historicalGalleryPlan } from "../scripts/historical-gallery-plan.mjs";
import { historicalAlbumSources } from "../scripts/photo-import-plan.mjs";
import type { CmsDocument } from "../src/lib/sanity-model";

function fixture() {
  const titles = [
    ...Object.keys(historicalAlbumSources),
    ...Array.from({ length: 11 }, (_, i) => `Recovered album ${i}`),
  ];
  const assets = Array.from({ length: 299 }, (_, i) => ({
    id: `image-${i}-100x100-jpg`,
    sha256: `verified-${i}`,
    bytes: 100,
  }));
  const documents: CmsDocument[] = assets.map((a, i) => ({
    _id: a.id,
    _type: "sanity.imageAsset",
    sha1hash: `original-${i}`,
    size: 100,
  }));
  documents.push(
    ...Object.values(historicalAlbumSources).map((sourceId, i) => ({
      _id: `story-${i}`,
      _type: "journalEntry",
      sourceId,
      photos: [],
    })),
  );
  const photos = Array.from({ length: 307 }, (_, i) => ({
    status: "success",
    source: `original-source-${i}`,
    sha1: `original-${i % 299}`,
    sha256: `verified-${i % 299}`,
    bytes: 100,
    associations: [{ album: titles[Math.floor(i / 22)], order: i % 22 }],
  }));
  return { documents, assets, inventory: { format: 1, albums: 14, photos } };
}

test("historical album plan reuses 299 originals in all 307 positions without touching existing records", () => {
  const f = fixture(),
    before = structuredClone(f);
  const albums = historicalGalleryPlan(f.documents, f.inventory, f.assets);
  assert.equal(albums.length, 14);
  assert.equal(albums.flatMap((a) => a.albumPhotos).length, 307);
  assert.equal(
    new Set(
      albums.flatMap((a) =>
        a.albumPhotos.map((p: { asset: { _ref: string } }) => p.asset._ref),
      ),
    ).size,
    299,
  );
  assert.equal(albums.filter((a) => a.journalEntry).length, 3);
  assert.equal(
    albums[0].sourceId,
    `journal-collection.${Object.values(historicalAlbumSources)[0]}`,
  );
  assert.deepEqual(
    albums.flatMap((a) =>
      a.albumPhotos.map((p: { asset: { _ref: string } }) => p.asset._ref),
    ),
    f.inventory.photos.map((_, i) => f.assets[i % 299].id),
  );
  assert.deepEqual(f, before);
  assert(
    albums.every(
      (a) =>
        !a._id.includes(".") &&
        a.editorialApproval === "approved" &&
        a.publicationEnabled,
    ),
  );
});

test("historical plan rejects ambiguous identities, unverifiable bytes, sequence gaps and occupied album identities", () => {
  const changes: Array<(f: ReturnType<typeof fixture>) => void> = [
    (f) => f.documents.push({ ...f.documents[0], _id: "another-asset" }),
    (f) => {
      f.assets[0].sha256 = "wrong";
    },
    (f) => {
      f.inventory.photos[0].associations[0].order = 1;
    },
    (f) =>
      f.documents.push({
        _id: "occupied",
        _type: "galleryAlbum",
        title: f.inventory.photos[0].associations[0].album,
      }),
    (f) =>
      f.documents.push({
        ...f.documents.find((d) => d._type === "journalEntry")!,
        _id: "conflicting-story",
      }),
  ];
  for (const change of changes) {
    const f = fixture();
    change(f);
    assert.throws(() =>
      historicalGalleryPlan(f.documents, f.inventory, f.assets),
    );
  }
});
