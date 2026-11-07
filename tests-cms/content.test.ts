import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mapSanity, type CmsDocument } from "../src/lib/sanity-model";
import { createContentAdapter } from "../src/lib/journal";
import { createServer } from "node:http";
import { createClient } from "@sanity/client";
import { readSanitySnapshot } from "../src/lib/sanity-read";

const ref = (id: string) => ({ _ref: id });
const fixture = (): CmsDocument[] => [
  {
    _id: "siteSettings",
    _type: "siteSettings",
    name: "Foundation",
    url: "https://example.org",
    featuredPrograms: [ref("program-p")],
  },
  {
    _id: "media-p",
    _type: "mediaItem",
    sourceId: "p",
    image: {
      asset: ref("image-abcdef-1200x800-jpg"),
      hotspot: { x: 0.4, y: 0.7 },
    },
    editorialApproval: "approved",
    publicationEnabled: true,
    alt: "People sharing a song",
    standaloneGallery: false,
  },
  {
    _id: "media-standalone",
    sourceId: "media.standalone",
    _type: "mediaItem",
    image: { asset: ref("image-other-1000x600-jpg") },
    editorialApproval: "approved",
    publicationEnabled: true,
    alt: "Archive",
    standaloneGallery: true,
  },
  {
    _id: "program-p",
    sourceId: "program.p",
    _type: "program",
    slug: { current: "program" },
    title: "Music",
  },
  {
    _id: "event-e",
    sourceId: "event.e",
    _type: "event",
    slug: { current: "gathering" },
    date: "2025-10-16",
  },
  {
    _id: "journal-e",
    _type: "journalEntry",
    sourceId: "journal.original",
    slug: { current: "story" },
    title: "Our gathering",
    publishedAt: "2026-11-03",
    kind: "event",
    event: ref("event-e"),
    programs: [ref("program-p"), ref("missing")],
    photos: [ref("media-p"), ref("media-p"), ref("missing")],
    body: [
      {
        _type: "block",
        _key: "b",
        style: "normal",
        markDefs: [],
        children: [{ _type: "span", text: "Real story", marks: [] }],
      },
    ],
  },
];
const adapt = (docs = fixture()) => {
  const { source, entries } = mapSanity(docs, "6jpdhhxg", "production");
  return createContentAdapter(source, entries, "2026-11-04");
};

test("published perspective defense excludes drafts and release versions", () => {
  const docs = fixture();
  docs.push(
    { ...docs[5], _id: "drafts.hidden", slug: { current: "hidden" } },
    { ...docs[5], _id: "versions.release.hidden" },
  );
  assert.equal(adapt(docs).getJournalEntries().length, 1);
  assert.equal(adapt(docs).getJournalEntry("hidden"), undefined);
});
test("future entries, unknown slugs and unpublished stories stay absent", () => {
  const docs = fixture();
  docs[5].publishedAt = "2099-01-01";
  assert.equal(adapt(docs).getJournalEntries().length, 0);
  assert.equal(adapt(docs).getJournalEntry("unknown"), undefined);
  assert.equal(
    adapt(
      docs.filter((d) => d._type !== "journalEntry"),
    ).getGalleryCollections().length,
    1,
  );
});
test("Journal and Gallery share media, stable identity, rename and old-slug lookup", () => {
  const docs = fixture();
  const before = adapt(docs);
  const collection = before.getGalleryCollections()[0];
  assert.equal(collection.id, "journal-collection.journal.original");
  assert.equal(collection.photos.length, 1);
  assert.equal(
    collection.photos[0],
    before.getEntryPhotos(before.getJournalEntries()[0])[0],
  );
  docs[5].title = "Renamed";
  docs[5].slug = { current: "new-story" };
  docs[5].previousSlugs = ["story"];
  const after = adapt(docs);
  assert.equal(after.getGalleryCollections()[0].id, collection.id);
  assert.equal(after.getGalleryCollections()[0].title, "Renamed");
  assert.equal(after.getGalleryCollections()[0].journalSlug, "new-story");
  assert.equal(after.getJournalEntry("story")?.slug, "new-story");
});
test("approval revocation and broken assets withdraw photos from every public model", () => {
  for (const patch of [
    { editorialApproval: "pending" },
    { publicationEnabled: false },
    { image: { asset: ref("broken") } },
    { assetExists: false },
  ]) {
    const docs = fixture();
    Object.assign(docs[1], patch);
    const { source } = mapSanity(docs, "6jpdhhxg", "production");
    assert.equal(
      source.media.some((m) => m.id === "p"),
      false,
    );
    assert.equal(
      adapt(docs).getEntryPhotos(adapt(docs).getJournalEntries()[0]).length,
      0,
    );
    assert.deepEqual(
      adapt(docs)
        .getGalleryCollections()
        .map((c) => c.id),
      ["standalone.community-archive"],
    );
  }
});
test("missing event refs, empty collections and news do not create Gallery collections", () => {
  for (const patch of [
    { event: ref("missing") },
    { photos: [] },
    { kind: "news" },
  ]) {
    const docs = fixture();
    Object.assign(docs[5], patch);
    assert.deepEqual(
      adapt(docs)
        .getGalleryCollections()
        .map((c) => c.id),
      ["standalone.community-archive"],
    );
  }
});
test("draft-only photos cannot leak into standalone archive; public unions deduplicate", () => {
  const docs = fixture();
  docs[5]._id = "drafts.journal.e";
  assert.deepEqual(
    adapt(docs)
      .getPublicPhotos()
      .map((p) => p.id),
    ["media.standalone"],
  );
  const published = fixture();
  published[1].standaloneGallery = true;
  assert.equal(adapt(published).getPublicPhotos().length, 2);
});
test("Portable Text, original event dates, program refs, CDN dimensions and focal point survive", () => {
  const docs = fixture();
  const snapshot = mapSanity(docs, "6jpdhhxg", "production");
  const adapter = adapt(docs);
  const entry = adapter.getJournalEntries()[0];
  assert.equal(entry.publishedAt, "2026-11-03");
  assert.equal(adapter.getEntryEvent(entry)?.date, "2025-10-16");
  assert.deepEqual(entry.programIds, ["program.p"]);
  assert.equal(entry.body?.[0].children[0].text, "Real story");
  assert.match(
    snapshot.source.media[0].src,
    /^https:\/\/cdn.sanity.io\/images\/6jpdhhxg\/production\//,
  );
  assert.equal(snapshot.source.media[0].width, 1200);
  assert.equal(snapshot.source.media[0].position, "40% 70%");
  assert.deepEqual(snapshot.source.home.featuredProgramSlugs, ["program"]);
});
test("missing singleton fails rather than silently mixing local content", () => {
  assert.throws(() => mapSanity([], "6jpdhhxg", "production"), /siteSettings/);
});

test("official SDK reads fresh published snapshots across rename, withdrawal and unpublication", async () => {
  let docs = fixture();
  const requests: URL[] = [];
  const server = createServer((req, res) => {
    requests.push(new URL(req.url!, "http://localhost"));
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        result: docs.filter((d) => !d._id.includes(".")),
        ms: 1,
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const client = createClient({
    projectId: "6jpdhhxg",
    dataset: "production",
    apiVersion: "2026-11-01",
    apiHost: `http://127.0.0.1:${address.port}`,
    useProjectHostname: false,
    useCdn: false,
    perspective: "published",
  });
  const read = async () => {
    const { source, entries } = await readSanitySnapshot(client);
    return createContentAdapter(source, entries, "2026-11-04");
  };
  try {
    assert.equal(
      (await read()).getGalleryCollections()[0].title,
      "Our gathering",
    );
    docs[5].title = "New title";
    docs[5].slug = { current: "new-url" };
    docs[5].previousSlugs = ["story"];
    assert.equal((await read()).getJournalEntry("story")?.slug, "new-url");
    docs[1].publicationEnabled = false;
    assert.equal((await read()).getGalleryCollections().length, 1);
    docs = docs.filter((d) => d._type !== "journalEntry");
    assert.equal((await read()).getJournalEntries().length, 0);
    assert.equal(requests.length, 4);
    assert.ok(
      requests.every(
        (url) => url.searchParams.get("perspective") === "published",
      ),
    );
    assert.ok(
      requests.every((url) => url.pathname.includes("/data/query/production")),
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("owner story uploads share one publication, support cover, fallback and decorative photos", () => {
  const docs = fixture();
  const story = docs[5];
  story.kind = "update";
  delete story.event;
  story.photos = [];
  story.body = [];
  story.excerpt = "A community afternoon";
  story.showInGallery = true;
  story.storyPhotos = Array.from({ length: 24 }, (_, i) => ({
    _key: `photo-${i}`,
    asset: ref("image-abcdef-1200x800-jpg"),
    cover: i === 10,
    decorative: i === 11,
  }));
  assert.equal(
    adapt(docs).getEntryPhotos(adapt(docs).getJournalEntries()[0]).length,
    0,
  );
  story.photoRightsConfirmed = true;
  const mapped = mapSanity(docs, "6jpdhhxg", "production");
  const adapter = adapt(docs);
  const photos = adapter.getEntryPhotos(adapter.getJournalEntries()[0]);
  assert.equal(photos.length, 24);
  assert.match(photos[0].id, /photo-10$/);
  assert.match(photos[0].alt, /Our gathering/);
  assert.equal(photos.find((p) => p.id.endsWith("photo-11"))?.alt, "");
  assert.deepEqual(mapped.entries[0].paragraphs, ["A community afternoon"]);
  assert.equal(adapter.getGalleryCollections()[0].photos.length, 24);
  story.showInGallery = false;
  assert.equal(adapt(docs).getGalleryCollections().length, 1); // standalone archive only
  story.photoRightsConfirmed = false;
  assert.equal(
    adapt(docs).getEntryPhotos(adapt(docs).getJournalEntries()[0]).length,
    0,
  );
  assert.equal((story.storyPhotos as unknown[]).length, 24); // input not mutated
});

test("optional legacy descriptions have accessible fallback; decorative images stay silent", () => {
  const docs = fixture();
  docs[1].alt = "";
  let photo = mapSanity(docs, "6jpdhhxg", "production").source.media.find(
    (p) => p.id === "p",
  )!;
  assert.match(photo.alt, /community photograph/);
  docs[1].decorative = true;
  photo = mapSanity(docs, "6jpdhhxg", "production").source.media.find(
    (p) => p.id === "p",
  )!;
  assert.equal(photo.alt, "");
});
