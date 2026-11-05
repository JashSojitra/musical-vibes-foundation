import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, relative, isAbsolute, basename } from "node:path";
import { createClient } from "@sanity/client";
import { mapSanity } from "../src/lib/sanity-model";
import { deriveGalleryCollections, journalSeed } from "../src/lib/journal";
import { content } from "../src/data/content";
import {
  target,
  contentTypes,
  hash,
  stable,
  authored,
  counts,
  references,
  publicDocs,
  baseId,
  isProtectedSystem,
  planRepair,
  stateOf,
  assertFresh,
  executeRepair,
  type Doc,
  type Mutation,
} from "./sanity-repair-plan";

// Historical identity allowlist ONLY. No seed field values are copied into a repair.
const migratedIdentities = new Map<string, string>([
  ...content.programs.map((p) => [p.id, "program"] as [string, string]),
  ...content.events.map((e) => [e.id, "event"] as [string, string]),
  ...journalSeed.map((e) => [e.id, "journalEntry"] as [string, string]),
  ...content.media.map(
    (m) => [`media.${m.id}`, "mediaItem"] as [string, string],
  ),
  ...content.faqs.map(
    (_, i) =>
      [`faq.${String(i + 1).padStart(3, "0")}`, "faq"] as [string, string],
  ),
]);
export function migrationRepairPlan(docs: Doc[]) {
  for (const d of docs) {
    if (isProtectedSystem(d)) continue;
    const base = baseId(d._id);
    if (base.includes(".") && migratedIdentities.get(base) !== d._type)
      throw Error(
        `Private-path ID/type is outside the historical migration allowlist: ${d._id}. Do not expose unrelated private content.`,
      );
  }
  return planRepair(docs);
}

interface Backup {
  version: number;
  target: typeof target;
  createdAt: string;
  documentsHash: string;
  assets: { id: string; file: string; bytes: number; sha256: string }[];
}
const digest = (bytes: Uint8Array, algorithm = "sha256") =>
  createHash(algorithm).update(bytes).digest("hex");
function child(dir: string, file: string) {
  const path = resolve(dir, file),
    rel = relative(dir, path);
  if (!rel || rel.startsWith("..") || isAbsolute(rel))
    throw Error("Unsafe artifact path");
  return path;
}
export async function repairFetch(
  url: string | URL,
  options: RequestInit,
  fetcher: typeof fetch = fetch,
) {
  try {
    return await fetcher(url, options);
  } catch (error) {
    const cause =
      error instanceof Error
        ? (error.cause as
            { code?: string; errors?: { code?: string }[] } | undefined)
        : undefined;
    const code =
      cause?.code ||
      cause?.errors
        ?.map((e) => e.code)
        .filter(Boolean)
        .join(",") ||
      "unknown";
    throw Error(
      `Request failed: ${options.method || "GET"} ${url} (${code}).${code.includes("EACCES") ? " Local network access denied; run through an approved network-enabled terminal." : " Check network/TLS access before retrying."}`,
    );
  }
}
export function assetBackupRequest(d: Doc, token: string) {
  const url = new URL(String(d.url));
  const assetKind =
    d._type === "sanity.imageAsset"
      ? "images"
      : d._type === "sanity.fileAsset"
        ? "files"
        : "";
  if (
    !assetKind ||
    url.protocol !== "https:" ||
    url.hostname !== "cdn.sanity.io" ||
    url.port ||
    url.username ||
    url.password ||
    url.hash ||
    url.search ||
    !url.pathname.startsWith(
      `/${assetKind}/${target.projectId}/${target.dataset}/`,
    )
  )
    throw Error(`Unexpected asset URL: ${d._id}`);
  // dl changes disposition only. dlRaw retrieves the byte-identical uploaded image;
  // Sanity requires authentication for this documented original-download endpoint.
  if (assetKind === "images") url.searchParams.set("dlRaw", "");
  return {
    url,
    options: {
      redirect: "error",
      ...(assetKind === "images"
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {}),
    } as RequestInit,
  };
}
export async function loadBackup(dir: string) {
  const backup = JSON.parse(
    await readFile(child(dir, "backup.json"), "utf8"),
  ) as Backup;
  if (backup.version !== 1 || stable(backup.target) !== stable(target))
    throw Error("Wrong backup format/target");
  const docs = (await readFile(child(dir, "documents.ndjson"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line) as Doc);
  if (hash(docs) !== backup.documentsHash)
    throw Error("Backup document hash mismatch");
  const assetIds = docs
    .filter((d) => ["sanity.imageAsset", "sanity.fileAsset"].includes(d._type))
    .map((d) => d._id)
    .sort();
  if (stable(assetIds) !== stable(backup.assets.map((a) => a.id).sort()))
    throw Error("Incomplete asset backup");
  for (const a of backup.assets) {
    const bytes = await readFile(child(dir, a.file));
    if (bytes.length !== a.bytes || digest(bytes) !== a.sha256)
      throw Error(`Backup asset hash mismatch: ${a.id}`);
    const asset = docs.find((d) => d._id === a.id)!;
    if (
      (typeof asset.size === "number" && bytes.length !== asset.size) ||
      (asset.sha1hash && digest(bytes, "sha1") !== asset.sha1hash)
    )
      throw Error(`Asset differs from original Sanity hash: ${a.id}`);
  }
  return { backup, docs };
}
async function main() {
  const args = process.argv.slice(2);
  const command = args.shift() || "--inventory";
  if (
    ![
      "--inventory",
      "--backup",
      "--dry-run",
      "--check-permissions",
      "--repair",
      "--verify",
    ].includes(command)
  )
    throw Error("Unknown command; see docs/SANITY-ID-REPAIR.md");
  let dir = "";
  if (args.length === 2 && args[0] === "--dir") dir = resolve(args[1]);
  else if (args.length)
    throw Error("Only --dir <private artifact directory> is accepted");
  if (command !== "--inventory" && !dir)
    throw Error("An explicit private --dir is required");
  if (dir) {
    const rel = relative(process.cwd(), dir);
    const privateRel = relative(resolve(".tmp/sanity-repair"), dir);
    if (
      !rel.startsWith("..") &&
      !isAbsolute(rel) &&
      (!privateRel || privateRel.startsWith("..") || isAbsolute(privateRel))
    )
      throw Error(
        "Repository backups must be under ignored .tmp/sanity-repair/<new-run>; otherwise choose a private path outside this repository",
      );
  }
  const token = process.env.SANITY_REPAIR_TOKEN;
  if (!token)
    throw Error(
      "SANITY_REPAIR_TOKEN must contain an existing operator credential with full dataset read access; never use public or Worker env vars",
    );
  const client = createClient({
    ...target,
    token,
    useCdn: false,
    perspective: "raw",
  });
  const anonymous = createClient({
    ...target,
    useCdn: false,
    perspective: "published",
  });
  const exportRaw = async (): Promise<Doc[]> => {
    const response = await repairFetch(
      `https://${target.projectId}.api.sanity.io/v${target.apiVersion}/data/export/${target.dataset}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        redirect: "error",
      },
    );
    if (!response.ok)
      throw Error(
        `Authenticated export failed (${response.status}); no writes performed`,
      );
    const docs = (await response.text())
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Doc);
    if (!docs.length || docs.some((d) => !d._id || !d._type || !d._rev))
      throw Error("Incomplete/invalid authenticated export");
    return docs.sort((a, b) => a._id.localeCompare(b._id));
  };
  const submit = (mutations: Mutation[], dryRun: boolean) =>
    client.request({
      uri: `/data/mutate/${target.dataset}`,
      method: "POST",
      query: {
        dryRun: String(dryRun),
        visibility: "sync",
        returnIds: "true",
        autoGenerateArrayKeys: "false",
      },
      body: { mutations },
    });
  if (command === "--inventory") {
    const docs = await exportRaw();
    let planning;
    try {
      planning = { plan: migrationRepairPlan(docs) };
    } catch (error) {
      planning = {
        blocker: error instanceof Error ? error.message : "Planning failed",
      };
      process.exitCode = 1;
    }
    console.log(
      JSON.stringify(
        {
          target,
          documentsHash: hash(docs),
          documents: docs.map((d) => ({
            id: d._id,
            type: d._type,
            revision: d._rev,
            sourceId: d.sourceId,
            slug: d.slug,
            previousSlugs: d.previousSlugs,
            references: references(d),
            authoredHash: hash(authored(d)),
          })),
          changes: planning.plan?.changes,
          currentPublicCounts: counts(docs),
          expectedPublicCounts: planning.plan?.expectedPublicCounts,
          blocker: planning.blocker,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (command === "--backup") {
    // No reuse/overwrite of old backups. Failed/incomplete directories must remain for investigation.
    await mkdir(dir);
    const docs = await exportRaw();
    await writeFile(
      child(dir, "documents.ndjson"),
      docs.map((d) => JSON.stringify(d)).join("\n") + "\n",
      { flag: "wx", mode: 0o600 },
    );
    const assets: Backup["assets"] = [];
    await mkdir(child(dir, "assets"));
    for (const d of docs.filter((d) =>
      ["sanity.imageAsset", "sanity.fileAsset"].includes(d._type),
    )) {
      const { url, options } = assetBackupRequest(d, token);
      const response = await repairFetch(url, options);
      if (!response.ok)
        throw Error(`Asset backup failed: ${d._id} (${response.status})`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (
        (typeof d.size === "number" && bytes.length !== d.size) ||
        (d.sha1hash && digest(bytes, "sha1") !== d.sha1hash)
      )
        throw Error(`Asset integrity mismatch: ${d._id}`);
      const file = `assets/${digest(Buffer.from(d._id))}.bin`;
      await writeFile(child(dir, file), bytes, { flag: "wx", mode: 0o600 });
      assets.push({
        id: d._id,
        file,
        bytes: bytes.length,
        sha256: digest(bytes),
      });
    }
    if (hash(await exportRaw()) !== hash(docs))
      throw Error(
        "Dataset changed during backup; pause editing and take another backup",
      );
    const backup: Backup = {
      version: 1,
      target,
      createdAt: new Date().toISOString(),
      documentsHash: hash(docs),
      assets,
    };
    await writeFile(
      child(dir, "backup.json"),
      JSON.stringify(backup, null, 2),
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      `Verified raw documents + ${assets.length} asset binaries backed up in ${dir}. No dataset writes.`,
    );
    return;
  }
  const { backup, docs } = await loadBackup(dir);
  const plan = migrationRepairPlan(docs);
  const planHash = hash(plan);
  if (command !== "--verify") assertFresh(backup.createdAt);
  const current = await exportRaw();
  const state = stateOf(plan, current);
  if (command === "--dry-run") {
    // Local planning ONLY. Never call even the mutation dryRun endpoint implicitly.
    await writeFile(
      child(dir, "plan.json"),
      JSON.stringify({ planHash, ...plan }, null, 2),
      { mode: 0o600 },
    );
    console.log(
      JSON.stringify(
        {
          state,
          planHash,
          exactPlan: child(dir, "plan.json"),
          changes: plan.changes,
          expectedPublicCounts: plan.expectedPublicCounts,
          unresolvedWeakReferences: plan.unresolvedWeakReferences,
          confirmation: `REPAIR ${target.projectId}/${target.dataset} ${planHash}`,
        },
        null,
        2,
      ),
    );
    return;
  }
  const saved = JSON.parse(await readFile(child(dir, "plan.json"), "utf8"));
  const { planHash: savedHash, ...savedPlan } = saved;
  if (savedHash !== planHash || hash(savedPlan) !== planHash)
    throw Error("Reviewed plan missing/modified; rerun --dry-run");
  if (command === "--check-permissions") {
    if (state !== "before" || !plan.changes.length)
      throw Error("No pending repair to permission-check");
    await submit(plan.mutations, true); // Sanity validates permissions and revisions without executing.
    if (hash(await exportRaw()) !== hash(current))
      throw Error("Dataset drift during permission check");
    await writeFile(
      child(dir, "permissions.json"),
      JSON.stringify({
        planHash,
        checkedAt: new Date().toISOString(),
        tokenHash: digest(Buffer.from(token)),
      }),
      { mode: 0o600 },
    );
    console.log(
      "Server dryRun accepted the EXACT transaction; no documents written. Permissions receipt recorded.",
    );
    return;
  }
  if (command === "--repair") {
    const permission = JSON.parse(
      await readFile(child(dir, "permissions.json"), "utf8"),
    );
    const age = Date.now() - Date.parse(permission.checkedAt);
    const result = await executeRepair(
      plan,
      current,
      {
        createdAt: backup.createdAt,
        confirmation: process.env.SANITY_REPAIR_CONFIRM,
        permissions:
          permission.planHash === planHash &&
          permission.tokenHash === digest(Buffer.from(token)) &&
          age >= 0 &&
          age < 15 * 60 * 1000,
      },
      submit,
    );
    await writeFile(
      child(dir, "receipt.json"),
      JSON.stringify(
        { planHash, completedAt: new Date().toISOString(), result },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    if (stateOf(plan, await exportRaw()) !== "after")
      throw Error(
        "Post-write integrity check failed; retain evidence; do not retry overwrites",
      );
    console.log(
      "Repair transaction complete; run --verify and the CMS browser checks. No old documents deleted.",
    );
    return;
  }
  if (state !== "after")
    throw Error("Repair has not been applied; verification cannot pass");
  const publiclyReadable = await anonymous.fetch<Doc[]>(
    "*[_type in $types]",
    { types: contentTypes },
    { perspective: "published", cache: "no-store" },
  );
  const expected = publicDocs(plan.active)
    .filter((d) => contentTypes.includes(d._type))
    .sort((a, b) => a._id.localeCompare(b._id));
  if (
    hash(
      publiclyReadable.sort((a, b) => a._id.localeCompare(b._id)).map(authored),
    ) !== hash(expected.map(authored))
  )
    throw Error(
      "Anonymous published documents differ from the exact repair plan",
    );
  const ids = new Set(publicDocs(current).map((d) => d._id));
  const unreadable = publiclyReadable.flatMap((d) =>
    references(d).filter((r) => !r.external && !r.weak && !ids.has(r.ref)),
  );
  if (unreadable.length)
    throw Error(
      `Anonymous unresolved strong references: ${stable(unreadable)}`,
    );
  const refIds = [
    ...new Set(
      publiclyReadable.flatMap((d) =>
        references(d)
          .filter((r) => !r.external && ids.has(r.ref))
          .map((r) => r.ref),
      ),
    ),
  ];
  for (let i = 0; i < refIds.length; i += 50) {
    const response = await repairFetch(
      `https://${target.projectId}.api.sanity.io/v${target.apiVersion}/data/doc/${target.dataset}/${refIds
        .slice(i, i + 50)
        .map(encodeURIComponent)
        .join(",")}`,
      { cache: "no-store", redirect: "error" },
    );
    if (!response.ok)
      throw Error(
        `Anonymous reference verification failed (${response.status})`,
      );
    const result = await response.json();
    if (result.omitted?.length)
      throw Error(
        `References not anonymously readable: ${stable(result.omitted)}`,
      );
  }
  const withAssets = publiclyReadable.map((d) => ({
    ...d,
    assetExists: references(d.image).every((r) => ids.has(r.ref)),
  }));
  const mapped = mapSanity(withAssets, target.projectId, target.dataset);
  const report = {
    planHash,
    publicCounts: counts(publiclyReadable),
    integrity:
      "exact authored fields and references; old documents/assets retained",
    adapter: {
      programs: mapped.source.programs.length,
      events: mapped.source.events.length,
      journal: mapped.entries.length,
      approvedMedia: mapped.source.media.length,
      galleryCollections: deriveGalleryCollections(
        mapped.entries,
        mapped.source.media,
      ).map((c) => ({
        id: c.id,
        journalSlug: c.journalSlug,
        photoIds: c.photos.map((p) => p.id),
      })),
    },
    unresolvedWeakReferences: plan.unresolvedWeakReferences,
  };
  await writeFile(
    child(dir, "verification.json"),
    JSON.stringify(report, null, 2),
    { mode: 0o600 },
  );
  console.log(JSON.stringify(report, null, 2));
}
if (basename(process.argv[1] || "") === "sanity-repair.ts")
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Repair command failed",
    );
    process.exitCode = 1;
  });
