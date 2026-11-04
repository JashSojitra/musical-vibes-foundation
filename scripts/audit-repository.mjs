// Read-only publication preflight. Reports locations, never credential values.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const git = (...args) =>
  execFileSync("git", args, { maxBuffer: 256 * 1024 * 1024 });
const tracked = git("ls-files", "-z").toString().split("\0").filter(Boolean);
const objects = git("rev-list", "--objects", "--all").toString();
const inventory = execFileSync(
  "git",
  [
    "cat-file",
    "--batch-check=%(objecttype) %(objectname) %(objectsize) %(rest)",
  ],
  {
    input: objects,
    maxBuffer: 256 * 1024 * 1024,
  },
)
  .toString()
  .trim()
  .split("\n")
  .map((line) => {
    const [, type, oid, size, path = ""] =
      line.match(/^(\S+) (\S+) (\d+) ?(.*)$/) ?? [];
    return { type, oid, bytes: Number(size), path };
  })
  .filter((item) => item.type === "blob");
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  [
    "GitHub token",
    /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/g,
  ],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  [
    "API secret",
    /\b(?:sk-proj-[A-Za-z0-9_-]{40,}|sk_live_[A-Za-z0-9]{20,})\b/g,
  ],
  ["JWT", /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g],
  [
    "credential assignment",
    /\b(?:api[_-]?key|api[_-]?token|client[_-]?secret|password|access[_-]?token)\b\s*[:=]\s*["'][^"'\r\n]{16,}["']/gi,
  ],
];
const findings = [];
const scan = (buffer, path, revision) => {
  if (buffer.includes(0)) return;
  const body = buffer.toString("utf8");
  for (const [category, regex] of patterns) {
    regex.lastIndex = 0;
    for (const match of body.matchAll(regex)) {
      // Templates and environment lookups are not embedded credentials.
      if (
        category === "credential assignment" &&
        /process\.env|placeholder|example|your[_-]|replace|SANITY_|NEXT_PUBLIC_/i.test(
          match[0],
        )
      )
        continue;
      findings.push({
        path,
        revision,
        category,
        line: body.slice(0, match.index).split("\n").length,
      });
    }
  }
};
// Include current tracked worktree changes as well as all reachable historical blobs.
for (const path of tracked) {
  try {
    scan(readFileSync(path), path, "worktree");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
for (const item of inventory)
  scan(git("cat-file", "blob", item.oid), item.path, item.oid);
const unwanted =
  /(?:^|\/)(?:\.env(?!\.example$)[^/]*|\.dev\.vars[^/]*|node_modules|\.next|\.next-dev|\.open-next|\.wrangler|\.vercel|\.turbo|dist|out|coverage|test-results|playwright-report|\.tmp|\.aws|\.codex)(?:\/|$)|\.(?:pem|key|p12|pfx)$/i;
const report = {
  scannedAt: new Date().toISOString(),
  trackedFiles: tracked.length,
  historicalBlobs: inventory.length,
  credentialFindings: findings,
  unwantedTrackedPaths: tracked.filter((path) => unwanted.test(path)),
  unwantedHistoricalPaths: [
    ...new Set(
      inventory.map((item) => item.path).filter((path) => unwanted.test(path)),
    ),
  ],
  largestHistoricalBlobs: [...inventory]
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10),
  blobsAtLeast10MiB: inventory.filter((item) => item.bytes >= 10 * 1024 ** 2),
  githubSizeBlockers: inventory.filter((item) => item.bytes > 100 * 1024 ** 2),
  limitations:
    "Pattern scan of tracked text and reachable history; not credential validation, binary forensics, or a replacement for GitHub secret scanning. Generated QA history is intentionally preserved.",
};
mkdirSync("docs/validation/navigation-final", { recursive: true });
writeFileSync(
  "docs/validation/navigation-final/publication-audit.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (
  findings.length ||
  report.unwantedTrackedPaths.length ||
  report.githubSizeBlockers.length
)
  process.exitCode = 1;
