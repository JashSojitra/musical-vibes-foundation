import { createHash } from "node:crypto";
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const base = (id) => id.replace(/^drafts\./, "");
export function refs(value, path = "") {
  if (Array.isArray(value))
    return value.flatMap((v, i) => refs(v, `${path}[${i}]`));
  if (!value || typeof value !== "object") return [];
  return [
    ...(typeof value._ref === "string"
      ? [
          {
            ref: value._ref,
            path,
            external: !!(value._dataset || value._projectId),
            weak: value._weak === true,
          },
        ]
      : []),
    ...Object.entries(value).flatMap(([k, v]) => refs(v, `${path}.${k}`)),
  ];
}
// Reports only: no mutations, deletion endpoint, seed overwrite or automatic permission approval.
export function productionPlan(docs, albums, requestedCleanup = []) {
  if (
    !docs.length ||
    docs.some((d) => !d._id || !d._rev || !d._type) ||
    new Set(docs.map((d) => d._id)).size !== docs.length
  )
    throw Error("Incomplete or duplicate raw documents");
  const inbound = (id) =>
    docs.flatMap((d) =>
      refs(d)
        .filter((r) => !r.external && r.ref === id)
        .map((r) => ({ id: d._id, revision: d._rev, ...r })),
    );
  const candidates = docs
    .filter(
      (d) =>
        ["program", "event", "journalEntry", "mediaItem", "faq"].includes(
          d._type,
        ) && base(d._id).includes("."),
    )
    .map((d) => ({
      id: d._id,
      revision: d._rev,
      reason:
        "retained private-path record; identity and owner edits require comparison",
      counterparts: docs
        .filter(
          (c) =>
            !base(c._id).includes(".") &&
            c._type === d._type &&
            ((c.sourceId || c._id) === (d.sourceId || base(d._id)) ||
              base(c._id) ===
                `mvf-${Buffer.from(base(d._id)).toString("base64url")}`),
        )
        .map((c) => ({ id: c._id, revision: c._rev })),
      inbound: inbound(d._id),
      proposedDeletion: false,
    }));
  // Explicit human list only; titles resembling tests are never deletion authority.
  const cleanup = requestedCleanup.map((id) => {
    const d = docs.find((d) => d._id === id);
    if (
      !d ||
      !["program", "event", "journalEntry", "mediaItem", "faq"].includes(
        d._type,
      )
    )
      throw Error(`Unsafe cleanup ID: ${id}`);
    return {
      id,
      revision: d._rev,
      documentHash: digest(d),
      inbound: inbound(id),
      blocked: true,
      reason:
        "Owner approval, reconciliation and atomic revision-guard implementation required",
    };
  });
  const photos = docs
    .filter(
      (d) =>
        d._type === "journalEntry" &&
        !d._id.startsWith("drafts.") &&
        !d._id.startsWith("versions.") &&
        !d._id.includes("."),
    )
    .flatMap((d) =>
      (d.storyPhotos || []).flatMap((p) => {
        const asset = p.asset?._ref;
        if (
          !asset ||
          !docs.some((a) => a._id === asset && a._type === "sanity.imageAsset")
        )
          return [];
        const id = `mvf-photo-${digest([d._id, p._key, asset]).slice(0, 32)}`;
        if (docs.some((a) => base(a._id) === id)) return [];
        return [
          {
            sourceDocument: d._id,
            sourceRevision: d._rev,
            ownerReviewRequired: true,
            missing: [
              "Owner-selected category",
              "Rights evidence and approval",
            ],
            createDraft: {
              _id: `drafts.${id}`,
              _type: "mediaItem",
              sourceId: `${d._id}:${p._key || asset}`,
              image: { ...p, _type: "image" },
              alt: p.alt || "",
              caption: p.caption || "",
              decorative: p.decorative === true,
              editorialApproval: "pending",
              publicationEnabled: false,
              standaloneGallery: false,
              consent: "unconfirmed",
            },
          },
        ];
      }),
    );
  return {
    format: 1,
    datasetHash: digest(docs),
    mode: "read-only proposal; no executable mutations",
    inventory: docs.map((d) => ({
      id: d._id,
      revision: d._rev,
      type: d._type,
      title: d.title,
      slug: d.slug,
      previousSlugs: d.previousSlugs,
      sourceId: d.sourceId,
      references: refs(d),
    })),
    suspectedTests: docs
      .filter(
        (d) =>
          ["journalEntry", "event", "program"].includes(d._type) &&
          /\b(test|dummy|sample|lorem|regression)\b/i.test(
            `${d.title || ""} ${d.slug?.current || ""}`,
          ),
      )
      .map((d) => ({
        id: d._id,
        revision: d._rev,
        title: d.title,
        inbound: inbound(d._id),
        decision:
          "inspect; preserve until owner classifies; regression fixtures are never deleted",
      })),
    retainedCandidates: candidates,
    proposedCleanup: cleanup,
    reusablePhotoDraftProposals: photos,
    archiveDraftProposals: albums.flatMap((a) => {
      const id = `mvf-archive-${digest(a.title).slice(0, 32)}`;
      const slug = a.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const matched = docs.some(
        (d) =>
          [d.title, d.sourceAlbum, d.source].includes(a.title) ||
          base(d._id) === id ||
          d.slug?.current === slug ||
          d.previousSlugs?.includes(slug),
      );
      if (matched) return [];
      return [
        {
          evidence: "docs/legacy-snapshot/gallery-index.json",
          ownerReviewRequired: true,
          missing: [
            "Owner-selected publication date",
            "Reviewed photo references",
            "Photo rights evidence",
            "Alt descriptions",
          ],
          createDraft: {
            _id: `drafts.${id}`,
            _type: "journalEntry",
            sourceId: `legacy-album:${a.title}`,
            title: a.title,
            slug: { _type: "slug", current: slug },
            excerpt: `Photographs listed in the original website archive under “${a.title}”.`,
            kind: "update",
            showInGallery: true,
            featuredOnHome: false,
            photos: [],
          },
        },
      ];
    }),
    archive: albums.map((a) => ({
      title: a.title,
      photoReferences: a.photos.length,
      videoReferences: a.videos.length,
      malformed: a.malformed,
      existingMatches: docs
        .filter((d) => [d.title, d.sourceAlbum, d.source].includes(a.title))
        .map((d) => d._id),
      decision:
        "Evidence supports album title only. Reconcile existing Updates before drafting; no inferred dates, event details, rights or publication date.",
    })),
    blockers: [
      "Full-read credential role must be independently verified",
      "No historical rights are inferred",
      "No automatic archive publication or cleanup",
      "Do not run original seed write importer",
    ],
  };
}
