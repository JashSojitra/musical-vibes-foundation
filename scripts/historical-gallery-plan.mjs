import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { historicalAlbumSources } from "./photo-import-plan.mjs";

/** Create-only plan from verified original bytes and literal recovered associations. */
export function historicalGalleryPlan(documents, inventory, backupAssets) {
  assert.equal(inventory.format, 1);
  assert.equal(inventory.albums, 14);
  assert.equal(inventory.photos.length, 307);
  const groups = new Map();
  const originals = new Set();
  for (const row of inventory.photos) {
    assert.equal(row.status, "success");
    const matches = documents.filter(
      (d) => d._type === "sanity.imageAsset" && d.sha1hash === row.sha1,
    );
    assert.equal(matches.length, 1, `Ambiguous original: ${row.source}`);
    const asset = matches[0];
    const binary = backupAssets.find((a) => a.id === asset._id);
    assert.equal(
      binary?.sha256,
      row.sha256,
      `Original hash mismatch: ${row.source}`,
    );
    assert.equal(binary.bytes, row.bytes);
    assert.equal(asset.size, row.bytes);
    originals.add(asset._id);
    for (const association of row.associations) {
      assert(typeof association.album === "string" && association.album.trim());
      assert(Number.isInteger(association.order) && association.order >= 0);
      if (!groups.has(association.album)) groups.set(association.album, []);
      groups.get(association.album).push({
        order: association.order,
        source: row.source,
        asset: asset._id,
      });
    }
  }
  assert.equal(originals.size, 299);
  assert.equal(groups.size, 14);
  assert.equal(
    [...groups.values()].reduce((sum, rows) => sum + rows.length, 0),
    307,
  );
  const albums = [...groups].map(([title, rows], order) => {
    rows.sort((a, b) => a.order - b.order);
    assert.deepEqual(
      rows.map((p) => p.order),
      rows.map((_, i) => i),
      `Incomplete or duplicate sequence: ${title}`,
    );
    const digest = createHash("sha256")
      .update(title)
      .digest("hex")
      .slice(0, 32);
    const source = historicalAlbumSources[title];
    const matches = source
      ? documents.filter(
          (d) =>
            d._type === "journalEntry" &&
            !d._id.includes(".") &&
            d.sourceId === source,
        )
      : [];
    if (source)
      assert.equal(
        matches.length,
        1,
        `Ambiguous published relationship: ${title}`,
      );
    const story = matches[0];
    if (story) {
      for (const reference of story.photos || []) {
        const photo = documents.find((d) => d._id === reference._ref);
        assert(
          rows.some(
            (row) =>
              row.asset === photo?.image?.asset?._ref &&
              row.source === photo?.source,
          ),
          `Unverified published relationship: ${title}`,
        );
      }
    }
    const album = {
      _id: `mvf-gallery-${digest}`,
      _type: "galleryAlbum",
      sourceId: story
        ? `journal-collection.${source}`
        : `historical-album.${digest}`,
      title,
      order,
      editorialApproval: "approved",
      publicationEnabled: true,
      albumPhotos: rows.map((row) => ({
        _type: "image",
        _key: `position-${row.order}`,
        asset: { _type: "reference", _ref: row.asset },
      })),
      ...(story
        ? { journalEntry: { _type: "reference", _ref: story._id } }
        : {}),
    };
    assert(
      !documents.some(
        (d) =>
          [album._id, `drafts.${album._id}`].includes(d._id) ||
          (d._type === "galleryAlbum" &&
            (d.sourceId === album.sourceId || d.title === title)),
      ),
      `Occupied album identity: ${title}`,
    );
    return album;
  });
  return albums;
}
