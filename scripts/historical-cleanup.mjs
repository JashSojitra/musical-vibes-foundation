/** Exact authorized historical cleanup only. No asset deletion or publication. */
import { digest, stable, target, ImportError } from "./historical-import.mjs";
import { historicalAlbumSources, suspectedIds } from "./photo-import-plan.mjs";
import { refs } from "./production-content-plan.mjs";
const guard = "_mvfHistoricalCleanupGuard";
const ordered = (docs) => [...docs].sort((a, b) => a._id.localeCompare(b._id));
const authored = (d) =>
  Object.fromEntries(
    Object.entries(d).filter(
      ([k]) => !["_rev", "_createdAt", "_updatedAt"].includes(k),
    ),
  );
const guardable = (d) =>
  !d._id.startsWith("_.") && !d._type.startsWith("sanity.");
function valid(docs) {
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
    throw new ImportError(
      "Invalid cleanup snapshot, reserved field or release content",
    );
}
export function makeCleanupPlan(input) {
  valid(input);
  const docs = ordered(input),
    byId = new Map(docs.map((d) => [d._id, d]));
  const mapping = new Map();
  for (const d of docs) {
    const repaired = byId.get(
      `mvf-${Buffer.from(d._id).toString("base64url")}`,
    );
    if (
      d._id.includes(".") &&
      !d._id.startsWith("drafts.") &&
      repaired?._type === d._type &&
      repaired.sourceId === d.sourceId
    )
      mapping.set(d._id, repaired._id);
  }
  const normalize = (value) =>
    Array.isArray(value)
      ? value.map(normalize)
      : value?._ref && (value._dataset || value._projectId)
        ? value
        : value && typeof value === "object"
          ? Object.fromEntries(
              Object.entries(value).map(([k, v]) => [
                k,
                k === "_ref" ? mapping.get(v) || v : normalize(v),
              ]),
            )
          : value;
  function equivalent(old, current, visited = new Set()) {
    if (!old || !current || old._type !== current._type) return false;
    if (visited.has(old._id)) return true;
    visited.add(old._id);
    const fields = (d) =>
      Object.fromEntries(
        Object.entries(authored(d)).filter(([k]) => k !== "_id"),
      );
    if (stable(normalize(fields(old))) !== stable(normalize(fields(current))))
      return false;
    return refs(old)
      .filter((r) => !r.external && mapping.has(r.ref))
      .every((r) =>
        equivalent(byId.get(r.ref), byId.get(mapping.get(r.ref)), visited),
      );
  }
  const proposed = new Map(),
    blocked = [];
  for (const base of suspectedIds)
    for (const id of [base, `drafts.${base}`]) {
      const d = byId.get(id);
      if (!d) continue;
      if (d._type !== "journalEntry")
        throw new ImportError(
          "Authorized test ID has a different type; stop cleanup",
        );
      proposed.set(id, "explicit owner-authorized test story");
    }
  for (const source of Object.values(historicalAlbumSources).flatMap((id) => [
    id,
    id.replace(/^journal\./, ""),
  ])) {
    const old = byId.get(source),
      current = byId.get(`mvf-${Buffer.from(source).toString("base64url")}`);
    if (!old) continue;
    if (
      old._type !==
        (source.startsWith("journal.") ? "journalEntry" : "event") ||
      old.sourceId !== source ||
      current?.sourceId !== source ||
      !equivalent(old, current)
    ) {
      blocked.push({
        id: source,
        reason:
          "Owner fields, referenced content or exact counterpart identity differ",
      });
      continue;
    }
    proposed.set(
      source,
      "exact redundant historical identity, including recursively equivalent reference targets",
    );
  }
  // Re-evaluate to a fixed point: removing one blocked parent may block a child.
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of proposed.keys()) {
      const inbound = docs.flatMap((d) =>
        refs(d)
          .filter((r) => !r.external && r.ref === id && !proposed.has(d._id))
          .map((r) => ({ document: d._id, path: r.path, weak: r.weak })),
      );
      if (inbound.length) {
        proposed.delete(id);
        blocked.push({
          id,
          reason: "Inbound references from retained documents",
          inbound,
        });
        changed = true;
      }
    }
  }
  const body = {
    format: 1,
    target,
    before: docs,
    deletions: [...proposed]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, reason]) => ({
        id,
        revision: byId.get(id)._rev,
        hash: digest(byId.get(id)),
        reason,
      })),
    blocked,
  };
  return { ...body, hash: digest(body) };
}
function assertCleanupPlan(plan) {
  const { hash, ...body } = plan;
  if (
    hash !== digest(body) ||
    hash !== makeCleanupPlan(plan.before).hash ||
    stable(plan.target) !== stable(target)
  )
    throw new ImportError("Cleanup plan integrity failure");
}
export function verifyCleanup(plan, current) {
  assertCleanupPlan(plan);
  valid(current);
  const deleted = new Set(plan.deletions.map((d) => d.id));
  const expected = plan.before.filter((d) => !deleted.has(d._id));
  const byId = new Map(current.map((d) => [d._id, d]));
  if (
    current.length !== expected.length ||
    expected.some(
      (d) =>
        !byId.has(d._id) ||
        stable(authored(d)) !== stable(authored(byId.get(d._id))) ||
        (!guardable(d) && stable(d) !== stable(byId.get(d._id))),
    )
  )
    throw new ImportError(
      "Cleanup outcome differs; stop and retain intent, never replay",
    );
  const ids = new Set(current.map((d) => d._id));
  if (
    current.some((d) =>
      refs(d).some((r) => !r.external && !r.weak && !ids.has(r.ref)),
    )
  )
    throw new ImportError("Cleanup left an unresolved strong reference");
  return {
    deleted: plan.deletions.map((d) => d.id),
    preserved: current.length,
    assetsPreserved: current.filter((d) => d._type.startsWith("sanity."))
      .length,
  };
}
export async function executeCleanup({
  plan,
  api,
  confirmation,
  saveIntent,
  saveReceipt,
}) {
  assertCleanupPlan(plan);
  if (
    confirmation !==
    `CLEANUP ${target.projectId}/${target.dataset} ${plan.hash}`
  )
    throw new ImportError("Exact authorized cleanup confirmation required");
  const fresh = async () => {
    if (digest(ordered(await api.export())) !== digest(plan.before))
      throw new ImportError("Dataset drift; take a fresh pre-cleanup backup");
  };
  await fresh();
  if (!plan.deletions.length)
    return { deleted: [], status: "No demonstrably safe deletions" };
  const mutations = [
    ...plan.before.filter(guardable).map((d) => ({
      patch: { id: d._id, ifRevisionID: d._rev, unset: [guard] },
    })),
    ...plan.deletions.map((d) => ({ delete: { id: d.id } })),
  ];
  if (
    mutations.length > 500 ||
    Buffer.byteLength(stable(mutations)) > 4_000_000
  )
    throw new ImportError("Cleanup exceeds safe transaction bounds");
  await api.mutate(mutations, true);
  await fresh();
  await saveIntent({
    planHash: plan.hash,
    mutationsHash: digest(mutations),
    beforeHash: digest(plan.before),
  });
  // No retry. Lost responses must be reconciled by verifyCleanup against a fresh export.
  const transaction = await api.mutate(mutations, false);
  const report = verifyCleanup(plan, await api.export());
  await saveReceipt({ ...report, transaction, planHash: plan.hash });
  return report;
}
