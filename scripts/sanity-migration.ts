import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@sanity/client";
import { content } from "../src/data/content";
import { journalSeed } from "../src/lib/journal";
import { mapSanity, type CmsDocument } from "../src/lib/sanity-model";

async function main() {
  const args = new Set(process.argv.slice(2));
  const allowed = new Set(["--dry-run", "--write", "--verify"]);
  if ([...args].some((a) => !allowed.has(a)) || args.size > 1)
    throw new Error("Use one of --dry-run (default), --write, --verify");
  const write = args.has("--write");
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "6jpdhhxg";
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  if (projectId !== "6jpdhhxg" || dataset !== "production")
    throw new Error("Unexpected migration target");
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-11-01";
  const runDir = resolve(".tmp/sanity-migration");
  await mkdir(runDir, { recursive: true });
  const ref = (id: string, key?: string) => ({
    _type: "reference",
    _ref: id,
    ...(key ? { _key: key } : {}),
  });
  const mediaId = (id: string) => `media.${id}`;
  const blocks = (paragraphs: string[]) =>
    paragraphs.map((text, i) => ({
      _type: "block",
      _key: `p${i}`,
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: `s${i}`, marks: [], text }],
    }));
  const identity = (item: { id: string; slug: string }) => ({
    _id: item.id,
    sourceId: item.id,
    slug: { _type: "slug", current: item.slug },
    previousSlugs: [],
  });
  const manifestSources = JSON.parse(
    await readFile("docs/legacy-snapshot/gallery-manifest.json", "utf8"),
  ) as { source: string; local: string }[];
  const assets = await Promise.all(
    content.media.map(async (m) => {
      const original = manifestSources.find((s) => s.source === m.source);
      if (!original)
        throw new Error(`Original source mapping missing: ${m.id}`);
      const path = resolve(original.local);
      if (
        !path.startsWith(resolve("public/assets/legacy") + "/") &&
        !path.startsWith(resolve("public/assets/legacy") + "\\")
      )
        throw new Error(`Unsafe original path: ${path}`);
      const bytes = await readFile(path);
      return {
        id: m.id,
        path,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        sha1: createHash("sha1").update(bytes).digest("hex"),
        bytes: bytes.length,
      };
    }),
  );
  const documents: CmsDocument[] = [
    ...content.programs.map(({ paragraphs, imageId, id, ...p }) => ({
      ...p,
      ...identity({ id, slug: p.slug }),
      _type: "program",
      body: blocks(paragraphs),
      image: ref(mediaId(imageId)),
    })),
    ...content.events.map(({ imageId, galleryIds, id, ...e }) => ({
      ...e,
      ...identity({ id, slug: e.slug }),
      _type: "event",
      image: ref(mediaId(imageId)),
      gallery: galleryIds.map((id) => ref(mediaId(id), id)),
    })),
    ...journalSeed.map(
      ({
        paragraphs,
        eventId,
        programIds,
        photoIds,
        status: _status,
        id,
        ...e
      }) => ({
        ...e,
        ...identity({ id, slug: e.slug }),
        _type: "journalEntry",
        body: blocks(paragraphs),
        event: eventId ? ref(eventId) : undefined,
        programs: programIds.map((id) => ref(id, id)),
        photos: photoIds.map((id) => ref(mediaId(id), id)),
      }),
    ),
    ...content.media.map((m) => ({
      _id: mediaId(m.id),
      _type: "mediaItem",
      sourceId: m.id,
      alt: m.alt,
      caption: m.caption,
      category: m.category,
      source: m.source,
      position: m.position,
      consent: "unconfirmed",
      editorialApproval: "pending",
      publicationEnabled: false,
      standaloneGallery: m.standaloneGallery,
      migrationHash: assets.find((a) => a.id === m.id)!.sha256,
    })),
    {
      _id: "siteSettings",
      _type: "siteSettings",
      ...content.settings,
      featuredPrograms: content.home.featuredProgramSlugs.map((slug) =>
        ref(content.programs.find((p) => p.slug === slug)!.id, slug),
      ),
      featuredEvents: content.home.featuredEventSlugs.map((slug) =>
        ref(content.events.find((e) => e.slug === slug)!.id, slug),
      ),
    },
    ...content.faqs.map((f, i) => ({
      _id: `faq.${String(i + 1).padStart(3, "0")}`,
      _type: "faq",
      ...f,
      order: i,
    })),
  ];
  const ids = new Set(documents.map((d) => d._id));
  if (ids.size !== documents.length) throw new Error("Duplicate document IDs");
  function validateReferences(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(validateReferences);
      return;
    }
    if (value && typeof value === "object") {
      const object = value as Record<string, unknown>;
      if (object._type === "reference" && !ids.has(object._ref as string))
        throw new Error(`Missing reference ${object._ref}`);
      Object.values(object).forEach(validateReferences);
    }
  }
  documents.forEach(validateReferences);
  for (const type of ["program", "event", "journalEntry"]) {
    const slugs = documents
      .filter((d) => d._type === type)
      .map((d) => d.slug!.current);
    if (new Set(slugs).size !== slugs.length)
      throw new Error(`Duplicate ${type} slug`);
  }
  const counts = (docs: CmsDocument[]) =>
    Object.fromEntries(
      [...new Set(docs.map((d) => d._type))]
        .sort()
        .map((type) => [type, docs.filter((d) => d._type === type).length]),
    );
  const manifest = {
    version: 1,
    projectId,
    dataset,
    counts: counts(documents),
    uniqueOriginals: new Set(assets.map((a) => a.sha256)).size,
    assets,
    documents,
    collections: journalSeed.map((e) => ({
      id: `journal-collection.${e.id}`,
      journalId: e.id,
      eventId: e.eventId,
      slug: e.slug,
      publishedAt: e.publishedAt,
      eventDate: content.events.find((event) => event.id === e.eventId)?.date,
    })),
  };
  await writeFile(
    resolve(runDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  if (!write && !args.has("--verify")) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          counts: manifest.counts,
          uniqueOriginals: manifest.uniqueOriginals,
          manifest: resolve(runDir, "manifest.json"),
          warnings: [
            "All imported photographs remain pending and disabled until owner review. No Sanity reads or writes performed.",
          ],
        },
        null,
        2,
      ),
    );
  } else {
    if (write && !process.env.SANITY_API_WRITE_TOKEN)
      throw new Error("--write requires migration-only SANITY_API_WRITE_TOKEN");
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      perspective: "published",
      token: process.env.SANITY_API_WRITE_TOKEN,
    });
    const existing = await client.fetch<CmsDocument[]>(
      '*[_type in ["program","event","journalEntry","mediaItem","siteSettings","faq"]]',
      {},
      { perspective: write ? "raw" : "published" },
    );
    if (write) {
      // Never overwrite owner edits. Preflight all collisions before uploading anything.
      for (const d of documents) {
        const found = existing.find((e) => e._id === d._id);
        if (!found && existing.some((e) => e._id === `drafts.${d._id}`))
          throw new Error(
            `Existing draft occupies migration ID: ${d._id}; review before importing`,
          );
        if (
          found &&
          (found._type !== d._type ||
            (d.sourceId && found.sourceId !== d.sourceId))
        )
          throw new Error(`Unrecognized ID collision: ${d._id}`);
        const collision = existing.find(
          (e) =>
            e._type === d._type &&
            d.slug?.current &&
            e.slug?.current === d.slug.current &&
            e._id.replace(/^drafts\./, "") !== d._id,
        );
        if (collision)
          throw new Error(
            `Existing slug collision: ${d._type}/${d.slug!.current}`,
          );
      }
      const receiptPath = resolve(runDir, "receipt.json");
      let receipt: { documentIds: string[]; assetIds: string[] } = {
        documentIds: [],
        assetIds: [],
      };
      try {
        receipt = JSON.parse(await readFile(receiptPath, "utf8"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      const saveReceipt = () =>
        writeFile(receiptPath, JSON.stringify(receipt, null, 2));
      await saveReceipt();
      const assetRefs = new Map<string, string>();
      for (const a of assets) {
        const existingMedia = existing.find((d) => d._id === mediaId(a.id));
        if (existingMedia) continue;
        if (!assetRefs.has(a.sha256)) {
          const found = await client.fetch<{ _id: string } | null>(
            '*[_type == "sanity.imageAsset" && sha1hash == $hash][0]{_id}',
            { hash: a.sha1 },
          );
          const asset =
            found ||
            (await client.assets.upload("image", await readFile(a.path), {
              filename: a.path.split(/[\\/]/).pop(),
            }));
          assetRefs.set(a.sha256, asset._id);
          if (!found) {
            receipt.assetIds.push(asset._id);
            await saveReceipt();
          }
        }
        documents.find((d) => d._id === mediaId(a.id))!.image = {
          _type: "image",
          asset: ref(assetRefs.get(a.sha256)!),
        };
      }
      const missing = documents.filter(
        (d) => !existing.some((e) => e._id === d._id),
      );
      if (missing.length) {
        const transaction = client.transaction();
        // A concurrent creation aborts the transaction instead of claiming somebody else's ID in the receipt.
        missing.forEach((d) => transaction.create(d));
        await transaction.commit({ visibility: "sync" });
        receipt.documentIds = [
          ...new Set([...receipt.documentIds, ...missing.map((d) => d._id)]),
        ];
        await saveReceipt();
      }
    }
    const after = await client.fetch<CmsDocument[]>("*[_id in $ids]", {
      ids: [...ids],
    });
    const actual = counts(after);
    if (JSON.stringify(actual) !== JSON.stringify(manifest.counts))
      throw new Error(
        `Count mismatch: ${JSON.stringify({ expected: manifest.counts, actual })}`,
      );
    for (const d of after) {
      const planned = documents.find((p) => p._id === d._id)!;
      if (planned.slug?.current !== d.slug?.current)
        throw new Error(
          `Slug changed since migration: ${d._id}; review owner edits`,
        );
      if (
        d._type === "mediaItem" &&
        !(d.image as { asset?: { _ref?: string } })?.asset?._ref
      )
        throw new Error(`Missing image asset: ${d._id}`);
    }
    const references = new Set<string>();
    function collectReferences(value: unknown): void {
      if (Array.isArray(value)) value.forEach(collectReferences);
      else if (value && typeof value === "object") {
        const object = value as Record<string, unknown>;
        if (object._type === "reference" && typeof object._ref === "string")
          references.add(object._ref);
        Object.values(object).forEach(collectReferences);
      }
    }
    after.forEach(collectReferences);
    const resolvedIds = new Set(
      await client.fetch<string[]>("*[_id in $ids]._id", {
        ids: [...references],
      }),
    );
    const broken = [...references].filter((id) => !resolvedIds.has(id));
    if (broken.length)
      throw new Error(
        `Missing published references/assets: ${broken.join(", ")}`,
      );
    mapSanity(after, projectId, dataset);
    await writeFile(
      resolve(runDir, "verification.json"),
      JSON.stringify(
        {
          expected: manifest.counts,
          actual,
          verifiedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify(
        {
          mode: write ? "write + verify" : "verify",
          counts: actual,
          report: resolve(runDir, "verification.json"),
        },
        null,
        2,
      ),
    );
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration failed");
  process.exitCode = 1;
});
