/** Private, additive historical import engine. Network is injected; tests never need credentials. */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { photoPlan, historicalAlbumSources } from "./photo-import-plan.mjs";
import { inspect, imageOrientation } from "./recover-photos.mjs";
/** Only fixed, locally authored messages may be shown by the CLI. */
export class ImportError extends Error {
  constructor(message) {
    super(message);
    this.name = "HistoricalImportError";
  }
}
export const target = Object.freeze({
  projectId: "6jpdhhxg",
  dataset: "production",
  apiVersion: "2026-11-01",
});
export const stable = (value) =>
  JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
export const digest = (value) =>
  createHash("sha256").update(stable(value)).digest("hex");
const sorted = (docs) => [...docs].sort((a, b) => a._id.localeCompare(b._id));
const authored = (d) =>
  Object.fromEntries(
    Object.entries(d).filter(
      ([k]) => !["_rev", "_createdAt", "_updatedAt"].includes(k),
    ),
  );
const guard = "_mvfHistoricalImportGuard";
// Only the six known historical Update/Event identities have retained ID-repair
// copies. These are aliases for collision checking, never merge/overwrite targets.
function historicalIdentity(d) {
  const base = d._id.replace(/^drafts\./, "");
  for (const journal of Object.values(historicalAlbumSources)) {
    const source =
      d._type === "journalEntry"
        ? journal
        : d._type === "event"
          ? journal.replace(/^journal\./, "")
          : null;
    if (
      source &&
      d.sourceId === source &&
      [source, `mvf-${Buffer.from(source).toString("base64url")}`].includes(
        base,
      )
    )
      return source;
  }
  return null;
}
function documents(docs) {
  if (
    !Array.isArray(docs) ||
    !docs.length ||
    docs.some(
      (d) =>
        !d._id ||
        !d._rev ||
        !d._type ||
        guard in d ||
        d._id.startsWith("versions."),
    ) ||
    new Set(docs.map((d) => d._id)).size !== docs.length
  )
    throw new ImportError("Invalid, duplicate, reserved or release documents");
  return sorted(docs);
}
function identities(docs) {
  const owners = new Map();
  for (const d of docs.filter((d) =>
    ["journalEntry", "event"].includes(d._type),
  )) {
    for (const value of [d.slug?.current, ...(d.previousSlugs || [])]
      .filter(Boolean)
      .map((s) => `${d._type}:slug:${s}`)
      .concat(d.sourceId ? [`${d._type}:source:${d.sourceId}`] : [])) {
      const id = historicalIdentity(d) || d._id.replace(/^drafts\./, "");
      if (owners.has(value) && owners.get(value) !== id)
        throw new ImportError("Duplicate slug/source identity");
      owners.set(value, id);
    }
  }
}
export function assetId(p) {
  return `image-${p.sha1}-${p.assetWidth || p.width}x${p.assetHeight || p.height}-${p.format === "jpeg" ? "jpg" : p.format}`;
}
function assetMatches(d, p) {
  return (
    d?._id === assetId(p) &&
    d._type === "sanity.imageAsset" &&
    d.sha1hash === p.sha1 &&
    d.size === p.bytes &&
    d.metadata?.dimensions?.width === (p.assetWidth || p.width) &&
    d.metadata?.dimensions?.height === (p.assetHeight || p.height)
  );
}
export async function makePlan(
  docs,
  albums,
  inventory,
  dir,
  { orientationAware = true } = {},
) {
  docs = documents(docs);
  identities(docs);
  if (inventory.photos.some((p) => p.status !== "success"))
    throw new ImportError("Recovery incomplete; no partial albums allowed");
  const proposal = photoPlan(docs, albums, inventory);
  if (new Set(albums.map((a) => a.title)).size !== albums.length)
    throw new ImportError("Duplicate album titles");
  const imports = [];
  for (const p of proposal.imports) {
    const rows = inventory.photos.filter((r) => r.sha256 === p.sha256);
    if (
      rows.some((r) => r.bytes !== rows[0].bytes || r.format !== rows[0].format)
    )
      throw new ImportError("Conflicting binary metadata");
    const item = { ...p, bytes: rows[0].bytes, format: rows[0].format };
    const bytes = await photoBytes(dir, item);
    if (orientationAware) {
      item.orientation = imageOrientation(bytes);
      item.assetWidth = item.orientation >= 5 ? item.height : item.width;
      item.assetHeight = item.orientation >= 5 ? item.width : item.height;
    }
    if (
      docs.some(
        (d) => d._id === assetId(item) && d._type !== "sanity.imageAsset",
      )
    )
      throw new ImportError("Asset ID collision with another document type");
    const matches = docs.filter(
      (d) =>
        d._type === "sanity.imageAsset" &&
        (d.sha1hash === p.sha1 || d._id === assetId(item)),
    );
    if (
      matches.length > 1 ||
      (matches.length && !assetMatches(matches[0], item))
    )
      throw new ImportError("Ambiguous or inconsistent asset identity");
    imports.push({ ...item, assetId: assetId(item) });
  }
  if (new Set(imports.map((p) => p.assetId)).size !== imports.length)
    throw new ImportError("SHA1 identity collision");
  const drafts = [];
  for (const a of proposal.albumProposals) {
    const source = historicalAlbumSources[a.album];
    const knownHistorical =
      source &&
      a.matches.some((m) => m.type === "journalEntry") &&
      a.matches.every((m) => {
        const identity = historicalIdentity(docs.find((d) => d._id === m.id));
        return (
          identity === source || identity === source.replace(/^journal\./, "")
        );
      });
    const bases = new Set(a.matches.map((m) => m.id.replace(/^drafts\./, "")));
    if (
      !knownHistorical &&
      (bases.size > 1 || a.matches.some((m) => m.type !== "journalEntry"))
    )
      throw new ImportError("Ambiguous historical match");
    if (!a.createDraft) continue; // Never patch existing historical Updates, photos, captions or crops.
    drafts.push({
      ...a.createDraft,
      storyPhotos: a.photos.map((p) => {
        const item = imports.find((i) => i.sha256 === p.sha256);
        if (!item) throw new ImportError("Unresolved album photograph");
        return {
          _type: "image",
          _key: p.proposedKey,
          asset: { _type: "reference", _ref: item.assetId },
        };
      }),
    });
  }
  identities([...docs, ...drafts]);
  const body = {
    format: 1,
    ...(orientationAware ? { orientationVersion: 1 } : {}),
    target,
    before: docs,
    inventoryHash: digest(inventory),
    albumsHash: digest(albums),
    imports,
    drafts,
    preservedAlbums: proposal.albumProposals.filter((a) => !a.createDraft),
    retainedIdentityGroups: Object.values(historicalAlbumSources)
      .flatMap((source) => [source, source.replace(/^journal\./, "")])
      .map((source) => ({
        source,
        documents: docs
          .filter((d) => historicalIdentity(d) === source)
          .map((d) => ({ id: d._id, revision: d._rev, hash: digest(d) })),
      }))
      .filter((group) => group.documents.length > 1),
    cleanup: proposal.cleanup,
  };
  return { ...body, hash: digest(body) };
}
export function assertPlan(plan) {
  const { hash, ...body } = plan;
  if (
    hash !== digest(body) ||
    stable(plan.target) !== stable(target) ||
    plan.format !== 1
  )
    throw new ImportError("Plan integrity/target mismatch");
}
export async function validateFiles(plan, inventory, albums, dir) {
  assertPlan(plan);
  if (
    digest(inventory) !== plan.inventoryHash ||
    digest(albums) !== plan.albumsHash
  )
    throw new ImportError("Inventory/album drift");
  const rebuilt = await makePlan(plan.before, albums, inventory, dir, {
    orientationAware: plan.orientationVersion === 1,
  });
  if (rebuilt.hash !== plan.hash)
    throw new ImportError("Plan no longer reproducible");
}
async function photoBytes(dir, p) {
  if (!/^[a-f0-9]{64}$/.test(p.sha256) || p.local !== `objects/${p.sha256}.bin`)
    throw new ImportError("Unsafe photo path");
  const path = resolve(dir, p.local);
  if (!path.startsWith(resolve(dir) + sep))
    throw new ImportError("Unsafe photo path");
  const bytes = await readFile(path),
    info = inspect(bytes);
  if (
    info.sha256 !== p.sha256 ||
    info.sha1 !== p.sha1 ||
    info.width !== p.width ||
    info.height !== p.height ||
    info.bytes !== p.bytes ||
    info.format !== p.format
  )
    throw new ImportError("Binary integrity mismatch");
  return bytes;
}
export function initialState(plan) {
  return {
    format: 1,
    planHash: plan.hash,
    expected: plan.before,
    uploads: {},
    drafts: "not-started",
    pending: null,
    receipts: [],
  };
}
/** Counts only: document identities, field values and credentials never enter CLI diagnostics.
 * Classification describes differences, not whether an owner authorized them.
 */
export function datasetDrift(expected, current) {
  const before = new Map(expected.map((d) => [d._id, d]));
  const after = new Map(current.map((d) => [d._id, d]));
  const result = {
    added: 0,
    removed: 0,
    contentChanged: 0,
    revisionOnly: 0,
    metadataOnly: 0,
  };
  for (const d of current) {
    const old = before.get(d._id);
    if (!old) result.added++;
    else if (stable(authored(old)) !== stable(authored(d)))
      result.contentChanged++;
    else if (old._rev !== d._rev) result.revisionOnly++;
    else if (stable(old) !== stable(d)) result.metadataOnly++;
  }
  for (const d of expected) if (!after.has(d._id)) result.removed++;
  return result;
}
function driftError(expected, current) {
  const diff = datasetDrift(expected, current);
  return new ImportError(
    `Dataset drift: added=${diff.added}, removed=${diff.removed}, content-changed=${diff.contentChanged}, revision-only=${diff.revisionOnly}, metadata-only=${diff.metadataOnly}. ` +
      "Authorization cannot be inferred. Stop; retain the plan, backup and checkpoints. Review a fresh full authenticated backup privately. With no pending request, create a new plan in a new run directory and validate before renewed approval; never edit hashes or revisions to bypass this guard. With a pending request, reconcile its outcome first; never replay or reset the checkpoint.",
  );
}
export function reconcile(plan, state, current) {
  assertPlan(plan);
  documents(current);
  identities(current);
  if (state.format !== 1 || state.planHash !== plan.hash)
    throw new ImportError("Checkpoint belongs to another plan");
  if (digest(sorted(current)) !== digest(sorted(state.expected)))
    throw driftError(state.expected, current);
  return {
    before: plan.before.length,
    after: current.length,
    uploaded: Object.keys(state.uploads).length,
    drafts: state.drafts,
    unchangedOriginals: plan.before.length,
  };
}
function expectedWith(state, added) {
  return sorted([...state.expected, ...added]);
}
function mutationBatch(plan, state) {
  const guards = state.expected
    .filter((d) => !d._type.startsWith("sanity.") && !d._id.startsWith("_."))
    .map((d) => ({
      patch: { id: d._id, ifRevisionID: d._rev, unset: [guard] },
    }));
  const mutations = [...guards, ...plan.drafts.map((create) => ({ create }))];
  if (
    mutations.length > 500 ||
    Buffer.byteLength(stable(mutations)) > 4_000_000
  )
    throw new ImportError("Draft transaction exceeds safe limit");
  return mutations;
}
async function resolvePending(plan, state, current, dir) {
  const pending = state.pending;
  if (!pending) return;
  documents(current);
  identities(current);
  if (pending.kind === "upload") {
    const p = plan.imports.find((p) => p.sha256 === pending.sha256);
    const orientation = imageOrientation(await photoBytes(dir, p));
    const canonical = {
      ...p,
      assetWidth: orientation >= 5 ? p.height : p.width,
      assetHeight: orientation >= 5 ? p.width : p.height,
    };
    const found = current.find((d) => d._id === assetId(canonical));
    if (!assetMatches(found, canonical))
      throw new ImportError(
        "Unresolved upload response: no verified asset; do not retry blindly",
      );
    if (digest(sorted(current)) !== digest(expectedWith(state, [found])))
      throw new ImportError("Dataset drift while reconciling upload");
    state.uploads[p.sha256] = found._id;
    if (found._id !== p.assetId) {
      state.requiresReplan = true;
      state.receipts.push({
        kind: "verified-orientation-correction",
        sha256: p.sha256,
        orientation,
        plannedAssetId: p.assetId,
        observedAssetId: found._id,
      });
    }
  } else {
    const old = new Map(state.expected.map((d) => [d._id, d]));
    const added = new Map(plan.drafts.map((d) => [d._id, d]));
    if (
      current.length !== old.size + added.size ||
      current.some(
        (d) =>
          stable(authored(d)) !==
            stable(authored(old.get(d._id) || added.get(d._id) || {})) ||
          (old.has(d._id) &&
            (d._type.startsWith("sanity.") || d._id.startsWith("_.")) &&
            d._rev !== old.get(d._id)._rev),
      )
    )
      throw new ImportError(
        "Unresolved draft transaction / changed owner content; never replay",
      );
    state.drafts = "complete";
  }
  state.expected = sorted(current);
  state.receipts.push({
    kind: pending.kind,
    requestId: pending.requestId || null,
    transactionId: pending.transactionId || null,
    reconciled: true,
    beforeHash: pending.beforeHash,
    afterHash: digest(state.expected),
    at: new Date().toISOString(),
  });
  state.pending = null;
}
/** Only explicit write=true + exact phase confirmation can reach injected write methods. */
export async function runPhase({
  plan,
  state,
  api,
  save,
  dir,
  phase,
  write = false,
  confirmation,
  interval = 1000,
  retries = 3,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  progress = () => {},
}) {
  assertPlan(plan);
  if (!["upload", "create-drafts", "validate", "verify"].includes(phase))
    throw new ImportError("Unknown phase");
  if (state.planHash !== plan.hash || state.format !== 1)
    throw new ImportError("Checkpoint mismatch");
  if (
    !Number.isInteger(interval) ||
    interval < 0 ||
    !Number.isInteger(retries) ||
    retries < 0 ||
    retries > 5
  )
    throw new ImportError("Invalid retry/rate limit");
  let current = await api.export();
  if (state.pending) {
    await resolvePending(plan, state, current, dir);
    await save(state);
  }
  const report = reconcile(plan, state, current);
  if (state.requiresReplan) {
    if (phase === "verify")
      throw new ImportError(
        "Legacy orientation plan is incomplete; retain its receipt and verify the new reviewed plan instead",
      );
    if (write)
      throw new ImportError(
        "Verified EXIF-oriented outcome; this legacy plan cannot write again. Preserve this run, take a fresh backup and review a new orientation-aware plan.",
      );
    return {
      ...report,
      dryRun: true,
      status:
        "Pending original verified with EXIF display dimensions; fresh backup and orientation-aware plan required; no writes",
    };
  }
  if (phase === "verify") {
    if (
      state.drafts !== "complete" ||
      plan.imports.some((p) => !current.some((d) => assetMatches(d, p)))
    )
      throw new ImportError("Import incomplete");
    return report;
  }
  if (phase === "validate" || !write)
    return {
      ...report,
      dryRun: true,
      requiredConfirmation: `${phase === "upload" ? "PUBLIC-PHOTOS" : "UNPUBLISHED-DRAFTS"} ${target.projectId}/${target.dataset} ${plan.hash}`,
    };
  if (plan.orientationVersion !== 1)
    throw new ImportError(
      "Legacy plans are read-only; take a fresh backup and validate an orientation-aware plan before writes",
    );
  const phrase = `${phase === "upload" ? "PUBLIC-PHOTOS" : "UNPUBLISHED-DRAFTS"} ${target.projectId}/${target.dataset} ${plan.hash}`;
  if (confirmation !== phrase)
    throw new ImportError(
      "Explicit approval of this exact write phase required",
    );
  if (phase === "create-drafts" && state.drafts === "complete")
    return { ...report, status: "already-complete; no writes" };
  if (
    phase === "upload" &&
    plan.imports.every((p) => current.some((d) => assetMatches(d, p)))
  )
    return { ...report, status: "all assets verified; no writes" };
  // Server dry-run validates transaction permissions before either write phase.
  const mutations = mutationBatch(plan, state);
  const permissionProbe =
    phase === "upload" ? mutations.filter((m) => m.patch) : mutations;
  if (permissionProbe.length) await api.mutate(permissionProbe, true);
  reconcile(plan, state, await api.export());
  if (phase === "upload") {
    for (const [index, p] of plan.imports.entries()) {
      current = await api.export();
      reconcile(plan, state, current);
      const found = current.find((d) => d._id === p.assetId);
      if (found) {
        if (!assetMatches(found, p)) throw new ImportError("Asset collision");
        progress({
          phase,
          completed: index + 1,
          total: plan.imports.length,
          reused: true,
        });
        continue;
      }
      const bytes = await photoBytes(dir, p);
      for (let attempt = 0; ; attempt++) {
        await sleep(interval * 2 ** attempt);
        reconcile(plan, state, await api.export());
        state.pending = {
          kind: "upload",
          sha256: p.sha256,
          beforeHash: digest(state.expected),
        };
        await save(state); // Durable intent precedes every request, including retries.
        try {
          const receipt = await api.upload(bytes, p);
          state.pending.requestId = receipt?.requestId || null;
          await save(state);
        } catch (error) {
          // Only a definitive rate rejection can be retried automatically. Timeouts/5xx remain pending.
          if ([400, 401, 403, 409, 422, 429].includes(error?.status)) {
            reconcile(plan, state, await api.export());
            state.pending = null;
            await save(state);
            if (error.status === 429 && attempt < retries) continue;
          }
          throw new ImportError(
            error?.status === 401 || error?.status === 403
              ? "Permission rejected; stop"
              : "Upload stopped; reconcile with resume before further writes",
          );
        }
        await resolvePending(plan, state, await api.export(), dir);
        await save(state);
        if (state.requiresReplan)
          throw new ImportError(
            "Verified EXIF outcome requires a fresh backup and plan before further writes",
          );
        break;
      }
      progress({ phase, completed: index + 1, total: plan.imports.length });
    }
  } else if (state.drafts !== "complete") {
    if (plan.imports.some((p) => !current.some((d) => assetMatches(d, p))))
      throw new ImportError("Upload/reuse verification incomplete");
    if (!plan.drafts.length) {
      state.drafts = "complete";
      await save(state);
    } else {
      reconcile(plan, state, await api.export());
      state.pending = {
        kind: "create-drafts",
        beforeHash: digest(state.expected),
      };
      await save(state);
      try {
        const receipt = await api.mutate(mutations, false);
        state.pending.transactionId = receipt?.transactionId || null;
        state.pending.requestId = receipt?.requestId || null;
        await save(state);
      } catch (error) {
        if ([400, 401, 403, 409, 422, 429].includes(error?.status)) {
          reconcile(plan, state, await api.export());
          state.pending = null;
          await save(state);
        }
        throw new ImportError(
          "Draft transaction stopped; resume must reconcile, never replay",
        );
      }
      await resolvePending(plan, state, await api.export(), dir);
      await save(state);
    }
  }
  return reconcile(plan, state, await api.export());
}
