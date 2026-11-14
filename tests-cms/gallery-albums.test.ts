import { test } from "node:test";
import assert from "node:assert/strict";
import { mapSanity, type CmsDocument } from "../src/lib/sanity-model";
import { createContentAdapter } from "../src/lib/journal";

const ref = (_ref: string) => ({ _type: "reference", _ref });
const image = (id: string, key: string) => ({
  _type: "image",
  _key: key,
  asset: ref(id),
  assetExists: true,
});
const a = "image-first-1200x800-jpg",
  b = "image-second-1600x900-jpg";
const fixture = (): CmsDocument[] => [
  { _id: "siteSettings", _type: "siteSettings" },
  {
    _id: "photo",
    _type: "mediaItem",
    sourceId: "owner-photo",
    image: { ...image(a, "owner"), hotspot: { x: 0.3, y: 0.6 } },
    editorialApproval: "approved",
    publicationEnabled: true,
    standaloneGallery: true,
    alt: "Owner description",
    caption: "Owner caption",
  },
  {
    _id: "story",
    _type: "journalEntry",
    sourceId: "historic-story",
    slug: { current: "historic-story" },
    title: "Owner title",
    publishedAt: "2026-11-03",
    kind: "event",
    showInGallery: true,
    photos: [ref("photo")],
  },
  {
    _id: "drafts.unfinished",
    _type: "journalEntry",
    slug: { current: "unfinished" },
    storyPhotos: [image("image-private-500x500-jpg", "draft")],
  },
  {
    _id: "album",
    _type: "galleryAlbum",
    sourceId: "journal-collection.historic-story",
    title: "Original album title",
    editorialApproval: "approved",
    publicationEnabled: true,
    journalEntry: ref("story"),
    albumPhotos: [image(a, "one"), image(b, "two"), image(a, "three")],
  },
];
const adapt = (docs: CmsDocument[]) => {
  const snapshot = mapSanity(docs, "6jpdhhxg", "production");
  return {
    ...snapshot,
    adapter: createContentAdapter(
      snapshot.source,
      snapshot.entries,
      "2026-11-14",
    ),
  };
};

test("independent albums preserve every ordered position, reuse owner media, and replace only the matching derived collection", () => {
  const docs = fixture(),
    before = structuredClone(docs);
  const { adapter } = adapt(docs);
  const albums = adapter.getGalleryCollections();
  assert.equal(albums.length, 1);
  assert.equal(albums[0].id, "journal-collection.historic-story");
  assert.deepEqual(
    albums[0].photos.map((p) => p.id),
    ["owner-photo", `gallery-photo-${b}`, "owner-photo"],
  );
  assert.equal(albums[0].photos[0].alt, "Owner description");
  assert.equal(albums[0].photos[0].caption, "Owner caption");
  assert.equal(albums[0].photos[0].position, "30% 60%");
  assert.match(albums[0].photos[0].originalSrc!, /first-1200x800\.jpg$/);
  assert.equal(albums[0].journalSlug, "historic-story");
  assert.equal(adapter.getPublicPhotos().length, 2);
  assert.equal(
    adapter.getEntryPhotos(adapter.getJournalEntries()[0]).length,
    1,
  );
  assert.equal(adapter.getJournalEntry("unfinished"), undefined);
  assert.deepEqual(docs, before);
});

test("an album remains public without its Update; draft references never become article links", () => {
  const docs = fixture();
  docs[2]._id = "drafts.story";
  docs[4].journalEntry = ref("drafts.story");
  const { adapter } = adapt(docs);
  assert.equal(adapter.getJournalEntries().length, 0);
  assert.equal(adapter.getGalleryCollections()[0].photos.length, 3);
  assert.equal(adapter.getGalleryCollections()[0].journalSlug, undefined);
  assert.equal(adapter.getGalleryCollections()[0].journalId, undefined);
  assert.equal(adapter.getPublicPhotos().length, 2);
});

test("album position metadata and crops do not overwrite owner media or other positions", () => {
  const docs = fixture();
  const positions = docs[4].albumPhotos as Array<Record<string, unknown>>;
  Object.assign(positions[0], {
    alt: "Album-specific description",
    caption: "Album caption",
    hotspot: { x: 0.7, y: 0.2 },
    crop: { left: 0.1, right: 0.1, top: 0, bottom: 0 },
  });
  const { adapter } = adapt(docs);
  const photos = adapter.getGalleryCollections()[0].photos;
  assert.equal(photos[0].alt, "Album-specific description");
  assert.equal(photos[0].caption, "Album caption");
  assert.equal(photos[0].position, "70% 20%");
  assert.notEqual(photos[0].src, photos[2].src);
  assert.equal(photos[2].caption, "Owner caption");
  assert.equal(
    adapter.getEntryPhotos(adapter.getJournalEntries()[0])[0].caption,
    "Owner caption",
  );
});

test("album approval, enablement and publication gates fail closed independently", () => {
  for (const change of [
    { editorialApproval: "pending" },
    { editorialApproval: "rejected" },
    { publicationEnabled: false },
    { editorialApproval: undefined },
    { publicationEnabled: undefined },
    { _id: "drafts.album" },
    { _id: "versions.release.album" },
  ]) {
    const docs = fixture();
    Object.assign(docs[4], change);
    const { source, adapter } = adapt(docs);
    assert.equal(source.galleryAlbums?.length, 0);
    assert.equal(
      adapter.getPublicPhotos().some((p) => p.src.includes("second")),
      false,
    );
  }
});

test("an approved album without a photograph array stays absent", () => {
  const docs = fixture();
  delete docs[4].albumPhotos;
  assert.deepEqual(adapt(docs).source.galleryAlbums, []);
});

test("broken album assets stay absent and sharing an asset never approves a withheld media record", () => {
  const docs = fixture();
  docs[1].editorialApproval = "pending";
  docs[1].publicationEnabled = false;
  const images = docs[4].albumPhotos as Array<Record<string, unknown>>;
  images[1].assetExists = false;
  const { source, adapter } = adapt(docs);
  assert.equal(
    source.media.some((p) => p.id === "owner-photo"),
    false,
  );
  assert.equal(adapter.getGalleryCollections()[0].photos.length, 2);
  assert.equal(adapter.getPublicPhotos().length, 1);
  assert.equal(
    adapter.getEntryPhotos(adapter.getJournalEntries()[0]).length,
    0,
  );
  docs[4].publicationEnabled = false;
  assert.equal(adapt(docs).adapter.getPublicPhotos().length, 0);
});
