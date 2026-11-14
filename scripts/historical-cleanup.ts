import { mkdir, open, readFile, rename } from "node:fs/promises";
import { resolve, relative, isAbsolute, join, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { loadBackup } from "./sanity-repair";
import {
  makeCleanupPlan,
  executeCleanup,
  verifyCleanup,
} from "./historical-cleanup.mjs";
import { sanityAPI } from "./historical-import-cli.mjs";
import { digest, ImportError } from "./historical-import.mjs";
async function privateWrite(file: string, value: unknown) {
  const handle = await open(file, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify(value, null, 2) + "\n");
    await handle.sync();
  } finally {
    await handle.close();
  }
}
async function main() {
  const [mode, ...args] = process.argv.slice(2);
  if (!["plan", "execute", "verify"].includes(mode))
    throw new ImportError(
      "Use cleanup plan|execute|verify with --backup and --run",
    );
  const options: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key in options) throw new ImportError("Duplicate cleanup flag");
    if (key === "--write") {
      options[key] = true;
      continue;
    }
    if (
      !["--backup", "--run", "--confirm"].includes(key) ||
      !args[i + 1] ||
      args[i + 1].startsWith("--")
    )
      throw new ImportError("Unknown or missing cleanup argument");
    options[key] = args[++i];
  }
  if (
    typeof options["--backup"] !== "string" ||
    typeof options["--run"] !== "string"
  )
    throw new ImportError(
      "Explicit verified backup and private run directory required",
    );
  if ((options["--write"] || options["--confirm"]) && mode !== "execute")
    throw new ImportError("Read-only cleanup modes reject write flags");
  if (options["--confirm"] && !options["--write"])
    throw new ImportError("Cleanup confirmation requires --write");
  const dir = resolve(options["--run"]),
    rel = relative(resolve(".tmp"), dir);
  if (
    !rel ||
    rel.startsWith("..") ||
    isAbsolute(rel) ||
    !dir.startsWith(resolve(".tmp") + sep)
  )
    throw new ImportError("Cleanup artifacts must be under ignored .tmp");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const lock = await open(join(dir, "active.lock"), "wx", 0o600);
  try {
    await lock.writeFile(
      JSON.stringify({ pid: process.pid, at: new Date().toISOString() }),
    );
    const { docs } = await loadBackup(resolve(options["--backup"]));
    const prepared = makeCleanupPlan(docs);
    if (mode === "plan") {
      await privateWrite(join(dir, "plan.json"), prepared);
      console.log(
        JSON.stringify(
          {
            planHash: prepared.hash,
            deletions: prepared.deletions,
            blocked: prepared.blocked.length,
            mode: "Offline proposal; no dataset writes",
          },
          null,
          2,
        ),
      );
      return;
    }
    const plan = JSON.parse(await readFile(join(dir, "plan.json"), "utf8"));
    if (plan.hash !== prepared.hash || digest(plan) !== digest(prepared))
      throw new ImportError("Cleanup plan differs from verified backup");
    const api = sanityAPI(process.env.SANITY_REPAIR_TOKEN);
    if (mode === "verify") {
      const report = verifyCleanup(plan, await api.export());
      await privateWrite(
        join(dir, `verification-${Date.now()}-${randomUUID()}.json`),
        report,
      );
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    if (!options["--write"]) {
      const current = (await api.export()).sort((a, b) =>
        a._id.localeCompare(b._id),
      );
      if (digest(current) !== digest(plan.before))
        throw new ImportError(
          "Dataset drift; fresh pre-cleanup backup required",
        );
      console.log(
        JSON.stringify(
          {
            dryRun: true,
            deletions: plan.deletions,
            requiredConfirmation: `CLEANUP 6jpdhhxg/production ${plan.hash}`,
          },
          null,
          2,
        ),
      );
      return;
    }
    // An existing intent may be ambiguous or complete. Never resubmit it.
    try {
      await readFile(join(dir, "intent.json"));
      throw new ImportError(
        "Cleanup was already attempted; use read-only verify and retain artifacts",
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const report = await executeCleanup({
      plan,
      api,
      confirmation: options["--confirm"],
      saveIntent: (value: unknown) =>
        privateWrite(join(dir, "intent.json"), value),
      saveReceipt: (value: unknown) =>
        privateWrite(join(dir, "receipt.json"), value),
    });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await lock.close();
    await mkdir(join(dir, "archive"), { recursive: true, mode: 0o700 });
    await rename(
      join(dir, "active.lock"),
      join(dir, "archive", `lock-${randomUUID()}.json`),
    );
  }
}
main().catch((error) => {
  console.error(
    error instanceof ImportError
      ? error.message
      : "Cleanup stopped. Check private files/permissions and reconcile any intent; no automatic retry.",
  );
  process.exitCode = 1;
});
