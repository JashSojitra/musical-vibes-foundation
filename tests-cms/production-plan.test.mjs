import test from "node:test";
import assert from "node:assert/strict";
import { productionPlan } from "../scripts/production-content-plan.mjs";
const doc = (id, type, fields = {}) => ({
  _id: id,
  _type: type,
  _rev: "r1",
  ...fields,
});
test("inventories strong, weak, nested and draft inbound links; never deletes by title", () => {
  const docs = [
    doc("old.one", "journalEntry", { title: "Test story" }),
    doc("drafts.owner", "other", {
      nested: [{ _ref: "old.one", _weak: true }],
    }),
    doc(`mvf-${Buffer.from("old.one").toString("base64url")}`, "journalEntry"),
    doc("external", "other", { _ref: "old.one", _dataset: "elsewhere" }),
  ];
  const report = productionPlan(docs, [], ["old.one"]);
  assert.equal(report.proposedCleanup[0].inbound.length, 1);
  assert.equal(report.proposedCleanup[0].inbound[0].weak, true);
  assert.equal(report.proposedCleanup[0].blocked, true);
  assert.equal(report.retainedCandidates[0].proposedDeletion, false);
  assert.equal(report.retainedCandidates[0].counterparts.length, 1);
  assert.throws(() => productionPlan(docs, [], ["absent"]));
});
test("existing photos become pending draft proposals with preserved crop, no asset upload or owner edits", () => {
  const docs = [
    doc("story", "journalEntry", {
      storyPhotos: [
        {
          _key: "a",
          _type: "image",
          asset: { _ref: "image-a" },
          crop: { top: 0.2 },
          alt: "Owner caption",
        },
      ],
    }),
    doc("image-a", "sanity.imageAsset"),
  ];
  const original = JSON.stringify(docs);
  const proposal = productionPlan(docs, []).reusablePhotoDraftProposals[0]
    .createDraft;
  assert.equal(proposal.publicationEnabled, false);
  assert.equal(proposal.consent, "unconfirmed");
  assert.equal(proposal.image.crop.top, 0.2);
  assert.equal(proposal.alt, "Owner caption");
  assert.equal(JSON.stringify(docs), original);
  assert.equal(
    productionPlan([...docs, doc(proposal._id, "mediaItem")], [])
      .reusablePhotoDraftProposals.length,
    0,
  );
});
test("refuses incomplete exports and asset cleanup; archive dates are not guessed", () => {
  assert.throws(() => productionPlan([], []));
  assert.throws(() =>
    productionPlan([doc("image-a", "sanity.imageAsset")], [], ["image-a"]),
  );
  const report = productionPlan(
    [doc("owner", "event")],
    [{ title: "Archive", photos: [], videos: [], malformed: [] }],
  );
  assert.equal(report.archive[0].existingMatches.length, 0);
  assert.equal(report.archive[0].publishedAt, undefined);
});
test("legacy redirect preserves queries and limits methods and exact paths", async () => {
  const { legacyRedirect } =
    await import("../cloudflare/production-routing.mjs");
  const result = legacyRedirect(
    new Request("https://example.org/pages/galleryseniors.html?from=old"),
  );
  assert.equal(result.status, 308);
  assert.equal(
    result.headers.get("location"),
    "https://example.org/gallery?from=old",
  );
  assert.equal(
    legacyRedirect(new Request("https://example.org/pages/missing.html")),
    null,
  );
  assert.equal(
    legacyRedirect(
      new Request("https://example.org/pages/contact.html", { method: "POST" }),
    ),
    null,
  );
});
test("archive drafts omit unknown publication dates and never overwrite matching current albums", () => {
  const album = {
    title: "Seniors Meet (May 8,2025)",
    photos: ["one.jpg"],
    videos: [],
    malformed: [],
  };
  const plan = productionPlan([doc("settings", "siteSettings")], [album]);
  const proposal = plan.archiveDraftProposals[0].createDraft;
  assert.ok(proposal._id.startsWith("drafts."));
  assert.equal(proposal.publishedAt, undefined);
  assert.deepEqual(proposal.photos, []);
  assert.equal(
    productionPlan(
      [doc("event", "event", { sourceAlbum: album.title })],
      [album],
    ).archiveDraftProposals.length,
    0,
  );
  assert.equal(
    productionPlan([doc(proposal._id, "journalEntry")], [album])
      .archiveDraftProposals.length,
    0,
  );
});
test("isolated production config rejects domain attachment, preview targets and extra bindings", async () => {
  const { validateConfig } = await import("../scripts/production-config.mjs");
  const config = validateConfig();
  assert.equal(config.workers_dev, false);
  assert.deepEqual(config.routes, []);
  for (const change of [
    { name: "musical-vibes-foundation-cms-preview" },
    { routes: [{ pattern: "example.org/*" }] },
    { workers_dev: true },
    { env: { production: {} } },
    { vars: { ...config.vars, CONTENT_SOURCE: "local" } },
  ])
    assert.throws(() => validateConfig({ ...config, ...change }));
});
