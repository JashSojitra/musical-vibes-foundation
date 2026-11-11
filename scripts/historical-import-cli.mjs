import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename } from "node:fs/promises";
import { resolve, relative, isAbsolute, join } from "node:path";
import {
  target,
  ImportError,
  digest,
  makePlan,
  validateFiles,
  initialState,
  runPhase,
} from "./historical-import.mjs";
const json = async (file) => JSON.parse(await readFile(file, "utf8"));
const privateWrite = async (file, value) => {
  const handle = await open(file, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify(value, null, 2) + "\n");
    await handle.sync();
  } finally {
    await handle.close();
  }
};
export function parseArgs(args) {
  const [mode = "plan", ...rest] = args;
  if (
    ![
      "plan",
      "validate",
      "upload",
      "create-drafts",
      "verify",
      "resume",
    ].includes(mode)
  )
    throw new ImportError("Unknown mode");
  const options = { mode, write: false };
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i];
    if (key === "--write") {
      if (options.write) throw new ImportError("Duplicate flag");
      options.write = true;
      continue;
    }
    if (
      !["--backup", "--photos", "--run", "--confirm", "--phase"].includes(
        key,
      ) ||
      !rest[i + 1] ||
      rest[i + 1].startsWith("--") ||
      key.slice(2) in options
    )
      throw new ImportError("Unknown, duplicate or missing argument");
    options[key.slice(2)] = rest[++i];
  }
  if (!options.backup || !options.photos || !options.run)
    throw new ImportError(
      "Usage: historical-import.ts <plan|validate|upload|create-drafts|verify|resume> --backup <verified-backup-dir> --photos <recovery-dir> --run <private-run-dir> [--write --confirm <exact-phase-phrase>] [--phase upload|create-drafts]",
    );
  if (
    options.mode === "resume"
      ? !["upload", "create-drafts"].includes(options.phase)
      : options.phase
  )
    throw new ImportError("Only resume requires --phase upload|create-drafts");
  if (options.write && !["upload", "create-drafts", "resume"].includes(mode))
    throw new ImportError("Read-only mode does not accept --write");
  if (options.confirm && !options.write)
    throw new ImportError("--confirm requires --write");
  const rel = relative(process.cwd(), resolve(options.run));
  if (
    !rel.startsWith(".tmp" + (process.platform === "win32" ? "\\" : "/")) ||
    isAbsolute(rel) ||
    rel.startsWith("..")
  )
    throw new ImportError("Run directory must be under ignored project .tmp/");
  return options;
}
/** No SDK auto-retries. Errors expose only fixed operation names and status codes. */
export function sanityAPI(token, fetcher = fetch) {
  if (!token)
    throw new ImportError(
      "SANITY_REPAIR_TOKEN is required (full authenticated dataset read and appropriate write permissions)",
    );
  const base = `https://${target.projectId}.api.sanity.io/v${target.apiVersion}`;
  async function request(path, init = {}) {
    let response;
    try {
      response = await fetcher(base + path, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${token}` },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(120000),
      });
    } catch {
      throw new ImportError(
        "Sanity request outcome unknown; retain checkpoint and reconcile",
      );
    }
    if (!response.ok) {
      const error = new ImportError(
        `Sanity request rejected (${response.status})`,
      );
      error.status = response.status;
      throw error;
    }
    return response;
  }
  return {
    async export() {
      const response = await request(`/data/export/${target.dataset}`);
      try {
        return (await response.text())
          .trim()
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => JSON.parse(line));
      } catch {
        throw new ImportError("Invalid or interrupted dataset export");
      }
    },
    async upload(bytes, p) {
      const response = await request(
        `/assets/images/${target.dataset}?filename=${p.sha256}.${p.format === "jpeg" ? "jpg" : p.format}`,
        {
          method: "POST",
          headers: { "Content-Type": `image/${p.format}` },
          body: bytes,
        },
      );
      return { requestId: response.headers.get("x-sanity-request-id") };
    },
    async mutate(mutations, dryRun) {
      const response = await request(
        `/data/mutate/${target.dataset}?dryRun=${dryRun ? "true" : "false"}&visibility=sync&returnIds=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mutations }),
        },
      );
      try {
        const result = await response.json();
        if (result.error) throw new ImportError();
        return {
          transactionId: result.transactionId || null,
          requestId: response.headers.get("x-sanity-request-id"),
        };
      } catch {
        throw new ImportError(
          "Invalid or interrupted mutation response; reconcile",
        );
      }
    },
  };
}
/** Existing assets must match the independently backed-up original SHA256, not just a SHA1 ID. */
export function verifyReuse(plan, backup) {
  for (const p of plan.imports.filter((p) =>
    plan.before.some((d) => d._id === p.assetId),
  )) {
    const evidence = backup?.assets?.find((a) => a.id === p.assetId);
    if (!evidence || evidence.sha256 !== p.sha256 || evidence.bytes !== p.bytes)
      throw new ImportError(
        "Reusable asset differs from verified backup original",
      );
  }
}
/**
 * @param {string[]} args
 * @param {{ loadBackup: (dir: string) => Promise<{docs: any[], backup?: {assets: {id: string, sha256: string, bytes: number}[]}}>, apiFactory?: typeof sanityAPI, output?: (message: string) => void }} dependencies
 */
export async function runCLI(
  args,
  { loadBackup, apiFactory = sanityAPI, output = console.log },
) {
  const o = parseArgs(args),
    dir = resolve(o.run);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  // An abandoned lock is deliberately never auto-broken. Operator checks the recorded PID first.
  const lock = await open(join(dir, "active.lock"), "wx", 0o600);
  await lock.writeFile(
    JSON.stringify({ pid: process.pid, started: new Date().toISOString() }),
  );
  try {
    const { docs, backup } = await loadBackup(resolve(o.backup));
    const inventory = await json(join(resolve(o.photos), "inventory.json"));
    const albums = await json(
      resolve("docs/legacy-snapshot/gallery-index.json"),
    );
    if (o.mode === "plan") {
      const plan = await makePlan(docs, albums, inventory, resolve(o.photos));
      verifyReuse(plan, backup);
      // Plan itself is local-only. validate is the required fresh authenticated comparison.
      await privateWrite(join(dir, "plan.json"), plan);
      await privateWrite(join(dir, "cleanup-proposal.json"), {
        planHash: plan.hash,
        automaticDeletion: false,
        candidates: plan.cleanup,
      });
      output(
        `Private plan prepared: ${plan.hash}. No network or CMS writes. Run validate before approval.`,
      );
      return;
    }
    const plan = await json(join(dir, "plan.json"));
    if (
      digest([...docs].sort((a, b) => a._id.localeCompare(b._id))) !==
      digest(plan.before)
    )
      throw new ImportError("Backup differs from approved plan");
    await validateFiles(plan, inventory, albums, resolve(o.photos));
    verifyReuse(plan, backup);
    const entries = (await readdir(dir))
      .filter((n) => /^checkpoint-\d{8}\.json$/.test(n))
      .sort();
    if (
      entries.some(
        (name, index) =>
          name !== `checkpoint-${String(index + 1).padStart(8, "0")}.json`,
      )
    )
      throw new ImportError(
        "Checkpoint sequence incomplete; retain files and reconcile",
      );
    let previousHash = null,
      state = initialState(plan);
    for (const file of entries) {
      const record = await json(join(dir, file));
      if (
        record.previousHash !== previousHash ||
        record.hash !==
          digest({ previousHash: record.previousHash, state: record.state })
      )
        throw new ImportError("Checkpoint chain integrity failure");
      previousHash = record.hash;
      state = record.state;
    }
    let sequence = entries.length;
    const save = async (value) => {
      const body = { previousHash, state: structuredClone(value) };
      const hash = digest(body);
      await privateWrite(
        join(dir, `checkpoint-${String(++sequence).padStart(8, "0")}.json`),
        { ...body, hash },
      );
      previousHash = hash;
    };
    const api = apiFactory(process.env.SANITY_REPAIR_TOKEN);
    const result = await runPhase({
      plan,
      state,
      api,
      save,
      dir: resolve(o.photos),
      phase: o.mode === "resume" ? o.phase : o.mode,
      write: o.write,
      confirmation: o.confirm,
      progress: (p) => output(`${p.phase}: ${p.completed}/${p.total}`),
    });
    const receipt = {
      planHash: plan.hash,
      mode: o.mode,
      writeRequested: o.write,
      result,
      at: new Date().toISOString(),
      before: plan.before.map((d) => ({
        id: d._id,
        revision: d._rev,
        hash: digest(d),
      })),
      after: state.expected.map((d) => ({
        id: d._id,
        revision: d._rev,
        hash: digest(d),
      })),
      events: state.receipts,
    };
    await privateWrite(
      join(dir, `receipt-${Date.now()}-${randomUUID()}.json`),
      receipt,
    );
    output(JSON.stringify(result, null, 2));
  } finally {
    await lock.close();
    await mkdir(join(dir, "archive"), { recursive: true, mode: 0o700 });
    await rename(
      join(dir, "active.lock"),
      join(dir, "archive", `lock-${Date.now()}-${randomUUID()}.json`),
    );
  }
}
