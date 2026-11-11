import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadBackup, repairFetch } from "./sanity-repair";
import { hash, target } from "./sanity-repair-plan";
import { productionPlan } from "./production-content-plan.mjs";

async function main() {
  const [dir, cleanupFile, ...extra] = process.argv.slice(2);
  if (!dir || extra.length)
    throw Error(
      "Usage: tsx scripts/production-content-audit.ts <verified-backup-dir> [explicit-cleanup-ids.json]",
    );
  const token = process.env.SANITY_REPAIR_TOKEN;
  if (!token)
    throw Error(
      "Missing full-read SANITY_REPAIR_TOKEN; no current inventory can be certified",
    );
  const { docs, backup } = await loadBackup(resolve(dir));
  const response = await repairFetch(
    `https://${target.projectId}.api.sanity.io/v${target.apiVersion}/data/export/${target.dataset}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      redirect: "error",
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw Error(`Authenticated export failed: ${response.status}`);
  const current = (await response.text())
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .sort((a, b) => a._id.localeCompare(b._id));
  if (hash(current) !== backup.documentsHash)
    throw Error("Dataset drift: take a new backup; no overwrites");
  const albums = JSON.parse(
    await readFile("docs/legacy-snapshot/gallery-index.json", "utf8"),
  );
  const ids = cleanupFile
    ? JSON.parse(await readFile(cleanupFile, "utf8"))
    : [];
  if (
    !Array.isArray(ids) ||
    ids.some((id) => typeof id !== "string") ||
    new Set(ids).size !== ids.length
  )
    throw Error("Cleanup list must contain unique exact IDs");
  const report = productionPlan(docs, albums, ids);
  await writeFile(
    resolve(dir, "production-plan.json"),
    JSON.stringify(
      { target, backupHash: backup.documentsHash, ...report },
      null,
      2,
    ) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Read-only plan written privately beside verified backup; no dataset writes. Review all proposals.",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
