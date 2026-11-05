import { createHash } from "node:crypto";
import { publicContentId } from "./sanity-public-ids";

export const target = {
  projectId: "6jpdhhxg",
  dataset: "production",
  apiVersion: "2026-11-01",
} as const;
export const contentTypes = [
  "program",
  "event",
  "journalEntry",
  "mediaItem",
  "siteSettings",
  "faq",
];
export interface Doc {
  _id: string;
  _type: string;
  _rev: string;
  [key: string]: unknown;
}
export const stable = (value: unknown): string =>
  JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
export const hash = (value: unknown) =>
  createHash("sha256").update(stable(value)).digest("hex");
export const baseId = (id: string) => id.replace(/^drafts\./, "");
const isAsset = (d: Doc) =>
  ["sanity.imageAsset", "sanity.fileAsset"].includes(d._type);
// Export includes reserved ACL, retention and deployed-schema records. They are opaque,
// backed up and compared for integrity, never cloned, patched or interpreted as content.
export const isProtectedSystem = (d: Doc) =>
  d._id.startsWith("_.") &&
  ["system.group", "system.retention", "system.schema"].includes(d._type);
export const publicDocs = (docs: Doc[]) =>
  docs.filter((d) => !d._id.includes("."));
export const counts = (docs: Doc[]) =>
  Object.fromEntries(
    contentTypes.map((t) => [
      t,
      publicDocs(docs).filter((d) => d._type === t).length,
    ]),
  );
export function authored(d: Doc) {
  return Object.fromEntries(
    Object.entries(d).filter(([k]) => !["_rev", "_updatedAt"].includes(k)),
  );
}
export function references(
  value: unknown,
  path = "",
): { path: string; ref: string; weak: boolean; external: boolean }[] {
  if (Array.isArray(value))
    return value.flatMap((v, i) => references(v, `${path}[${i}]`));
  if (!value || typeof value !== "object") return [];
  const o = value as Record<string, unknown>;
  return [
    ...(typeof o._ref === "string"
      ? [
          {
            path: `${path}._ref`,
            ref: o._ref,
            weak: o._weak === true,
            external: !!(o._dataset || o._projectId),
          },
        ]
      : []),
    ...Object.entries(o).flatMap(([k, v]) =>
      references(v, path ? `${path}.${k}` : k),
    ),
  ];
}
function remap(value: unknown, ids: Record<string, string>): unknown {
  if (Array.isArray(value)) return value.map((v) => remap(v, ids));
  if (!value || typeof value !== "object") return value;
  const o = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(o).map(([k, v]) => [
      k,
      k === "_ref" && typeof v === "string" && !o._dataset && !o._projectId
        ? ids[v] || v
        : remap(v, ids),
    ]),
  );
}
export interface Mutation {
  create?: Record<string, unknown>;
  patch?: {
    id: string;
    ifRevisionID: string;
    set?: Record<string, unknown>;
    unset?: string[];
  };
}
export function planRepair(input: Doc[]) {
  const docs = [...input].sort((a, b) => a._id.localeCompare(b._id));
  const byId = new Map(docs.map((d) => [d._id, d]));
  if (
    byId.size !== docs.length ||
    docs.some((d) => !d._id || !d._type || !d._rev)
  )
    throw Error("Invalid/duplicate documents or missing revisions");
  if (docs.some((d) => d._id.startsWith("versions.")))
    throw Error("Release versions require a separately reviewed repair");
  if (docs.some((d) => "_mvfRepairRevisionGuard" in d))
    throw Error("Reserved guard field already exists");
  const ids: Record<string, string> = Object.create(null);
  for (const d of docs) {
    if (isProtectedSystem(d)) continue;
    const base = baseId(d._id);
    if (!base.includes(".")) continue;
    if (
      !contentTypes.includes(d._type) ||
      isAsset(d) ||
      d._type === "siteSettings"
    )
      throw Error(`Unsupported private-path document: ${d._id}`);
    const root = publicContentId(base);
    if (`drafts.${root}`.length > 128)
      throw Error(`Target ID leaves no room for a draft prefix: ${d._id}`);
    ids[d._id] = d._id.startsWith("drafts.") ? `drafts.${root}` : root;
  }
  // References may point to a published counterpart which has only a draft.
  for (const id of Object.keys(ids)) {
    const base = baseId(id);
    ids[base] = publicContentId(base);
    ids[`drafts.${base}`] = `drafts.${publicContentId(base)}`;
  }
  for (const d of docs.filter((d) => ids[d._id])) {
    const root = baseId(ids[d._id]);
    if (byId.has(root) || byId.has(`drafts.${root}`))
      throw Error(
        `Target collision: ${d._id} -> ${ids[d._id]}; never adopt/overwrite an existing target`,
      );
    const counterpart = byId.get(
      d._id.startsWith("drafts.") ? baseId(d._id) : `drafts.${d._id}`,
    );
    if (counterpart && counterpart._type !== d._type)
      throw Error(`Published/draft type mismatch: ${d._id}`);
    if (
      counterpart &&
      (counterpart.sourceId || baseId(d._id)) !== (d.sourceId || baseId(d._id))
    )
      throw Error(`Published/draft sourceId mismatch: ${d._id}`);
  }
  const changes: {
    from: string;
    to: string;
    kind: string;
    referenceChanges: { path: string; from: string; to: string }[];
    addedSourceId?: string;
    fields: string[];
  }[] = [];
  const mutations: Mutation[] = [];
  const active: Doc[] = [];
  for (const d of docs) {
    if (isProtectedSystem(d)) {
      active.push(d);
      continue;
    }
    const mapped = remap(d, ids) as Doc;
    const cloned = !!ids[d._id];
    if (cloned) {
      mapped._id = ids[d._id];
      // Retain the adapter's pre-repair fallback identity when older records lack sourceId.
      if (!mapped.sourceId && d._type !== "faq") {
        if ("sourceId" in mapped && mapped.sourceId !== "")
          throw Error(`Invalid sourceId: ${d._id}`);
        mapped.sourceId = baseId(d._id);
      }
    }
    const fields = Object.keys(mapped).filter(
      (k) => k !== "_id" && stable(mapped[k]) !== stable(d[k]),
    );
    if (
      !cloned &&
      fields.length &&
      (isAsset(d) || d._type.startsWith("sanity."))
    )
      throw Error(`System/asset reference change needs review: ${d._id}`);
    const refs = references(d)
      .filter((r) => !r.external && ids[r.ref] && ids[r.ref] !== r.ref)
      .map((r) => ({ path: r.path, from: r.ref, to: ids[r.ref] }));
    if (cloned || fields.length) {
      changes.push({
        from: d._id,
        to: mapped._id,
        kind: cloned ? "create" : "patch-references",
        referenceChanges: refs,
        ...(mapped.sourceId !== d.sourceId
          ? { addedSourceId: String(mapped.sourceId) }
          : {}),
        fields,
      });
      if (cloned)
        mutations.push({
          create: Object.fromEntries(
            Object.entries(mapped).filter(([k]) => k !== "_rev"),
          ),
        });
      else
        mutations.push({
          patch: {
            id: d._id,
            ifRevisionID: d._rev,
            set: Object.fromEntries(fields.map((k) => [k, mapped[k]])),
          },
        });
    }
    active.push(mapped);
  }
  const activeIds = new Set(active.map((d) => d._id));
  const unresolved = active
    .filter((d) => !isProtectedSystem(d))
    .flatMap((d) =>
      references(d)
        .filter((r) => !r.external && !activeIds.has(r.ref))
        .map((r) => ({ document: d._id, ...r })),
    );
  if (unresolved.some((r) => !r.weak))
    throw Error(`Unresolved strong references: ${stable(unresolved)}`);
  const publicIds = new Set(publicDocs(active).map((d) => d._id));
  const privatePublicRefs = publicDocs(active).flatMap((d) =>
    references(d)
      .filter(
        (r) => !r.external && activeIds.has(r.ref) && !publicIds.has(r.ref),
      )
      .map((r) => `${d._id}:${r.ref}`),
  );
  if (privatePublicRefs.length)
    throw Error(
      `Published documents reference drafts/private paths: ${privatePublicRefs.join(", ")}`,
    );
  // Treat each pub/draft pair as one identity, but reject unrelated slug/sourceId collisions.
  const owners = new Map<string, string>();
  for (const d of active.filter((d) => contentTypes.includes(d._type))) {
    const slug = (d.slug as { current?: string } | undefined)?.current;
    const previous = Array.isArray(d.previousSlugs) ? d.previousSlugs : [];
    for (const key of [...new Set([slug, ...previous].filter(Boolean))]
      .map((s) => `${d._type}:slug:${s}`)
      .concat(d.sourceId ? [`${d._type}:source:${d.sourceId}`] : [])) {
      if (owners.has(key) && owners.get(key) !== baseId(d._id))
        throw Error(`Identity collision: ${key}`);
      owners.set(key, baseId(d._id));
    }
  }
  // Guard existing content revisions in the SAME transaction as the creates/reference updates.
  // Unsetting a known-absent field leaves authored values intact and acquires revision checks.
  if (changes.length)
    mutations.unshift(
      ...docs
        .filter(
          (d) =>
            !isAsset(d) &&
            !isProtectedSystem(d) &&
            !d._type.startsWith("sanity.") &&
            !mutations.some((m) => m.patch?.id === d._id),
        )
        .map((d) => ({
          patch: {
            id: d._id,
            ifRevisionID: d._rev,
            unset: ["_mvfRepairRevisionGuard"],
          },
        })),
    );
  if (
    mutations.length > 500 ||
    Buffer.byteLength(stable(mutations)) > 4_000_000
  )
    throw Error(
      "Repair exceeds conservative single-transaction limit; do not batch automatically",
    );
  const legacyIds = docs.filter((d) => ids[d._id]).map((d) => d._id);
  const expected = [
    ...docs.filter((d) => legacyIds.includes(d._id)),
    ...active,
  ].sort((a, b) => a._id.localeCompare(b._id));
  return {
    version: 1,
    target,
    beforeHash: hash(docs),
    ids,
    changes,
    mutations,
    active,
    expected,
    expectedPublicCounts: counts(active),
    unresolvedWeakReferences: unresolved,
    cleanupCandidates: legacyIds,
    expectedHash: hash(expected.map(authored)),
  };
}
export type RepairPlan = ReturnType<typeof planRepair>;
export function stateOf(plan: RepairPlan, current: Doc[]) {
  const sorted = [...current].sort((a, b) => a._id.localeCompare(b._id));
  if (hash(sorted) === plan.beforeHash) return "before";
  if (hash(sorted.map(authored)) === plan.expectedHash) return "after";
  throw Error(
    "Dataset drift / owner edits / collision detected. Stop; take a NEW backup and review. Never overwrite or replay an old plan.",
  );
}
export function assertFresh(createdAt: string, now = Date.now()) {
  const age = now - Date.parse(createdAt);
  if (!Number.isFinite(age) || age < 0 || age > 2 * 60 * 60 * 1000)
    throw Error("Backup must be fresh (at most two hours old)");
}
export async function executeRepair(
  plan: RepairPlan,
  current: Doc[],
  options: { createdAt: string; confirmation?: string; permissions: boolean },
  submit: (mutations: Mutation[], dryRun: boolean) => Promise<unknown>,
) {
  assertFresh(options.createdAt);
  if (
    options.confirmation !==
    `REPAIR ${target.projectId}/${target.dataset} ${hash(plan)}`
  )
    throw Error("Explicit confirmation of the exact plan is required");
  const state = stateOf(plan, current);
  if (state === "after" || !plan.changes.length)
    return { status: "already-applied; no writes" };
  if (!options.permissions)
    throw Error("Verify permissions with --check-permissions first");
  await submit(plan.mutations, true); // Recheck server validation/permissions immediately before commit.
  return submit(plan.mutations, false);
}
