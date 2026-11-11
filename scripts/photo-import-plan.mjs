/** Local proposal only: intentionally no Sanity client or network operations. */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inventory, inspect, sha } from "./recover-photos.mjs";
import { productionPlan, refs } from "./production-content-plan.mjs";
export const suspectedIds = [
  "5616f846-7b1b-4264-9c96-e76c0fe846e6",
  "a257f306-d199-4d83-bfe0-780ffc2c121b",
];
// Explicit legacy seed identities, corroborated by preserved source labels; no fuzzy title match.
export const historicalAlbumSources = {
  "Diwali Celebrations (Oct 16 2025)": "journal.event.diwali-celebrations-2025",
  "Seniors Meet (Aug 21 2025)": "journal.event.seniors-club-picnic-2025",
  "Seniors Club Christmas Celebration (Dec 8 2025)":
    "journal.event.seniors-club-christmas-2025",
};
export function photoPlan(docs, albums, recovered) {
  const basic = productionPlan(docs, albums);
  const expected = inventory(albums);
  if (
    recovered.format !== 1 ||
    recovered.photos.length !== expected.length ||
    new Set(recovered.photos.map((p) => p.source)).size !== expected.length
  )
    throw Error("Incomplete/duplicate recovery manifest");
  for (const row of expected) {
    const actual = recovered.photos.find((p) => p.source === row.source);
    if (
      !actual ||
      JSON.stringify(actual.associations) !== JSON.stringify(row.associations)
    )
      throw Error("Recovery association drift");
  }
  const imports = [];
  for (const row of recovered.photos.filter((p) => p.status === "success")) {
    if (
      !/^[a-f0-9]{64}$/.test(row.sha256) ||
      !/^[a-f0-9]{40}$/.test(row.sha1) ||
      row.local !== `objects/${row.sha256}.bin` ||
      !row.width ||
      !row.height
    )
      throw Error("Invalid recovered object");
    const duplicate = imports.find((p) => p.sha256 === row.sha256);
    if (duplicate) {
      if (
        duplicate.sha1 !== row.sha1 ||
        duplicate.width !== row.width ||
        duplicate.height !== row.height
      )
        throw Error("Inconsistent duplicate metadata");
      continue;
    }
    const assets = docs.filter(
      (d) =>
        d._type === "sanity.imageAsset" &&
        (d.sha1hash === row.sha1 || d._id.split("-")[1] === row.sha1),
    );
    imports.push({
      sha256: row.sha256,
      sha1: row.sha1,
      local: row.local,
      width: row.width,
      height: row.height,
      originalFilename: row.filename,
      sourceURLs: recovered.photos
        .filter((p) => p.sha256 === row.sha256)
        .map((p) => p.source),
      existingAssetIds: assets.map((d) => d._id),
      action: assets.length
        ? "reuse-existing-asset"
        : "propose-upload-after-owner-approval",
      ownerApprovalRequired: true,
    });
  }
  const albumProposals = albums.map((a) => {
    const sourceId = historicalAlbumSources[a.title];
    const slug = a.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const draftId = `drafts.mvf-archive-${sha(JSON.stringify(a.title)).slice(0, 32)}`;
    const matches = docs.filter(
      (d) =>
        d._id === draftId ||
        d._id === draftId.slice(7) ||
        (["journalEntry", "event"].includes(d._type) &&
          ([d.title, d.sourceAlbum, d.source].includes(a.title) ||
            d.sourceId === `legacy-album:${a.title}` ||
            d._id === draftId ||
            d._id === draftId.slice(7) ||
            d.slug?.current === slug ||
            d.previousSlugs?.includes(slug) ||
            (sourceId &&
              [sourceId, sourceId.replace(/^journal\./, "")].some(
                (id) =>
                  d.sourceId === id ||
                  d._id.replace(/^drafts\./, "") === id ||
                  d._id.replace(/^drafts\./, "") ===
                    `mvf-${Buffer.from(id).toString("base64url")}`,
              )))),
    );
    const photos = a.photos.map((source, order) => {
      const row = recovered.photos.find((p) =>
        p.associations.some(
          (x) =>
            x.album === a.title && x.order === order && x.sourcePath === source,
        ),
      );
      const asset = imports.find((p) => p.sha256 === row?.sha256);
      return {
        order,
        sourcePath: source,
        source: row?.source,
        status: row?.status,
        sha256: row?.sha256,
        existingAssetIds: asset?.existingAssetIds || [],
        binding:
          asset?.existingAssetIds.length === 1
            ? "reuse-reference-after-owner-approval"
            : "pending-upload-or-owner-resolution",
        proposedKey: `legacy-${sha([a.title, order, source].join(":")).slice(0, 24)}`,
      };
    });
    return {
      album: a.title,
      dateLabel: a.title.match(/\(([^)]*)\)/)?.[1] || null,
      matches: matches.map((d) => ({
        id: d._id,
        revision: d._rev,
        type: d._type,
      })),
      decision: matches.length
        ? "preserve existing content; owner reconciles ordered photographs"
        : "review unpublished draft; renamed content may still exist",
      ownerApprovalRequired: true,
      photos,
      ...(matches.length
        ? {}
        : {
            createDraft: {
              _id: draftId,
              _type: "journalEntry",
              sourceId: `legacy-album:${a.title}`,
              title: a.title,
              slug: { _type: "slug", current: slug },
              kind: "update",
              showInGallery: true,
              featuredOnHome: false,
              storyPhotos: [],
            },
          }),
      blockers: [
        "Rights and participant consent",
        "Owner checks renamed matches",
        "Publication date, description and alt text require owner evidence",
        "Resolve missing photos and approve ordered asset assignments before import",
      ],
    };
  });
  function associatedPhotos(document, visited = new Set()) {
    if (visited.has(document._id)) return [];
    visited.add(document._id);
    return refs(document)
      .filter((r) => !r.external)
      .flatMap((r) => {
        const target = docs.find((d) => d._id === r.ref);
        if (!target)
          return [{ ...r, sourceDocument: document._id, unresolved: true }];
        return target._type === "sanity.imageAsset"
          ? [{ ...r, sourceDocument: document._id, assetRevision: target._rev }]
          : associatedPhotos(target, visited);
      });
  }
  const cleanup = suspectedIds.map((id) => ({
    id,
    blocked: true,
    variants: docs
      .filter(
        (d) =>
          d._id === id ||
          d._id === `drafts.${id}` ||
          (d._id.startsWith("versions.") && d._id.endsWith(`.${id}`)),
      )
      .map((d) => ({
        id: d._id,
        revision: d._rev,
        title: d.title,
        documentHash: sha(JSON.stringify(d)),
        references: refs(d),
        associatedPhotos: associatedPhotos(d),
        inbound: docs.flatMap((other) =>
          refs(other)
            .filter((r) => !r.external && r.ref === d._id)
            .map((r) => ({ id: other._id, revision: other._rev, ...r })),
        ),
      })),
  }));
  return {
    format: 1,
    mode: "local non-executable proposal; no uploads, mutations or publication",
    datasetHash: basic.datasetHash,
    fullReadVerified: false,
    imports,
    albumProposals,
    cleanup,
    blockers: [
      "Caller must verify fresh complete authenticated backup and ACL; local export alone cannot certify completeness",
      "Refresh dataset/revisions and compare assets immediately before any separately authorized import",
      "Do not run seed migration; preserve all current documents and assets",
    ],
  };
}
export async function verifiedPhotoPlan(docs, albums, recovered, dir) {
  const plan = photoPlan(docs, albums, recovered);
  for (const item of plan.imports) {
    const bytes = await readFile(resolve(dir, item.local));
    const actual = inspect(bytes);
    if (
      actual.sha256 !== item.sha256 ||
      actual.sha1 !== item.sha1 ||
      actual.width !== item.width ||
      actual.height !== item.height
    )
      throw Error("Recovered binary integrity mismatch");
  }
  return plan;
}
async function runCli() {
  const [file, ...extra] = process.argv.slice(2);
  if (!file || extra.length)
    throw Error("Usage: npm run photos:plan -- <fresh-private-export.ndjson>");
  const docs = (await readFile(file, "utf8"))
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const albums = JSON.parse(
    await readFile("docs/legacy-snapshot/gallery-index.json", "utf8"),
  );
  const dir = resolve(".tmp/photo-recovery");
  const recovered = JSON.parse(
    await readFile(resolve(dir, "inventory.json"), "utf8"),
  );
  const report = await verifiedPhotoPlan(docs, albums, recovered, dir);
  await writeFile(
    resolve(dir, `proposal-${Date.now()}.json`),
    JSON.stringify(report, null, 2) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  console.log("Private proposal saved in .tmp/photo-recovery. No CMS writes.");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  runCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
