/** Byte-preserving legacy recovery. No CMS client, credentials, transforms or writes. */
import { readFile, writeFile, mkdir, rename, open } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
export const origin = "https://www.musicalvibesfoundation.com";
export const sha = (bytes, algorithm = "sha256") =>
  createHash(algorithm).update(bytes).digest("hex");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
// Windows scanners/readers can briefly deny replacing an existing file. Retry
// only sharing/permission errors, keep the old checkpoint intact, and fail with
// the original filesystem error if the bounded window does not clear.
export async function replaceFile(
  source,
  destination,
  { renameFile = rename, sleep = pause, platform = process.platform } = {},
) {
  for (let attempt = 0; ; attempt++) {
    try {
      await renameFile(source, destination);
      return;
    } catch (error) {
      if (
        platform !== "win32" ||
        !["EPERM", "EACCES", "EBUSY"].includes(error.code) ||
        attempt >= 5
      )
        throw error;
      await sleep(25 * 2 ** attempt);
    }
  }
}
export function sourceURL(source) {
  const u = new URL(
    source.startsWith("../assets/") ? source.slice(2) : source,
    origin,
  );
  if (
    u.origin !== origin ||
    !u.pathname.startsWith("/assets/") ||
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !/\.(jpe?g|webp)$/i.test(u.pathname)
  )
    throw Error("Unverified asset URL");
  return u.href;
}
// Inspect actual signatures and frame headers, never extensions or HTTP content types.
export function inspect(bytes) {
  let width, height, format;
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    format = "jpeg";
    if (bytes.lastIndexOf(Buffer.from([255, 217])) < 2)
      throw Error("Truncated JPEG");
    let p = 2;
    while (p + 4 < bytes.length) {
      if (bytes[p++] !== 255) throw Error("Invalid JPEG marker");
      while (bytes[p] === 255) p++;
      const marker = bytes[p++];
      if (marker === 218 || marker === 217) break;
      const size = bytes.readUInt16BE(p);
      if (size < 2 || p + size > bytes.length)
        throw Error("Invalid JPEG segment");
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker)
      ) {
        if (size < 8) throw Error("Invalid JPEG frame");
        height = bytes.readUInt16BE(p + 3);
        width = bytes.readUInt16BE(p + 5);
        break;
      }
      p += size;
    }
  } else if (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    format = "webp";
    if (bytes.readUInt32LE(4) + 8 !== bytes.length)
      throw Error("Truncated WebP");
    const kind = bytes.toString("ascii", 12, 16);
    if (kind === "VP8X") {
      width = bytes.readUIntLE(24, 3) + 1;
      height = bytes.readUIntLE(27, 3) + 1;
    }
    if (kind === "VP8 ") {
      if (bytes.toString("hex", 23, 26) !== "9d012a")
        throw Error("Invalid WebP");
      width = bytes.readUInt16LE(26) & 16383;
      height = bytes.readUInt16LE(28) & 16383;
    }
    if (kind === "VP8L") {
      if (bytes[20] !== 47) throw Error("Invalid WebP");
      const bits = bytes.readUInt32LE(21);
      width = (bits & 16383) + 1;
      height = ((bits >>> 14) & 16383) + 1;
    }
  }
  if (!width || !height || width * height > 100_000_000)
    throw Error("Unsupported or invalid image dimensions/signature");
  return {
    width,
    height,
    format,
    bytes: bytes.length,
    sha256: sha(bytes),
    sha1: sha(bytes, "sha1"),
  };
}
export function inventory(albums) {
  const records = new Map();
  for (const album of albums)
    album.photos.forEach((source, order) => {
      const url = sourceURL(source);
      if (!records.has(url))
        records.set(url, {
          source: url,
          filename: decodeURIComponent(new URL(url).pathname.split("/").at(-1)),
          associations: [],
        });
      records.get(url).associations.push({
        album: album.title,
        order,
        sourcePath: source,
        dateLabel: album.title.match(/\(([^)]*)\)/)?.[1] || null,
      });
    });
  return [...records.values()];
}
async function json(file) {
  return JSON.parse(await readFile(file, "utf8"));
}
export async function recover({
  albums,
  samples = [],
  dir = ".tmp/photo-recovery",
  root = ".",
  offline = false,
  concurrency = 2,
  retries = 2,
  interval = 750,
  timeout = 20000,
  fetcher = fetch,
}) {
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 4 ||
    !Number.isInteger(retries) ||
    retries < 0 ||
    retries > 4 ||
    !Number.isFinite(interval) ||
    interval < 0 ||
    !Number.isFinite(timeout) ||
    timeout < 1
  )
    throw Error("Invalid recovery bounds");
  dir = resolve(dir);
  await mkdir(resolve(dir, "objects"), { recursive: true });
  // Refuse concurrent operators sharing one state file; a crashed process leaves a reviewable lock.
  const lock = await open(resolve(dir, "recovery.lock"), "wx");
  try {
    let previous;
    try {
      previous = await json(resolve(dir, "inventory.json"));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    const rows = inventory(albums),
      old = new Map((previous?.photos || []).map((r) => [r.source, r]));
    let gate = Promise.resolve();
    async function throttle() {
      const ready = gate;
      gate = gate.then(() => pause(interval));
      await ready;
    }
    async function checkpoint() {
      const data = {
        format: 1,
        generatedAt: new Date().toISOString(),
        albums: albums.length,
        photos: rows,
      };
      await writeFile(
        resolve(dir, "inventory.next.json"),
        JSON.stringify(data, null, 2) + "\n",
      );
      await replaceFile(
        resolve(dir, "inventory.next.json"),
        resolve(dir, "inventory.json"),
      );
    }
    let saving = Promise.resolve();
    async function save() {
      saving = saving.then(checkpoint);
      await saving;
    }
    let cursor = 0;
    async function worker() {
      while (cursor < rows.length) {
        const row = rows[cursor++];
        const prior = old.get(row.source),
          sample = samples.find((s) => sourceURL(s.source) === row.source);
        let bytes, reused;
        if (/^[a-f0-9]{64}$/.test(prior?.sha256 || "")) {
          try {
            const b = await readFile(
              resolve(dir, "objects", `${prior.sha256}.bin`),
            );
            if (sha(b) === prior.sha256) {
              bytes = b;
              reused = "resume";
            }
          } catch {}
        }
        if (!bytes && sample) {
          try {
            const local = resolve(root, sample.local);
            const rel = relative(resolve(root, "public/assets/legacy"), local);
            if (rel.startsWith("..") || isAbsolute(rel))
              throw Error("Unsafe sample path");
            const b = await readFile(local);
            const m = inspect(b);
            if (
              m.sha256 !== sample.sha256.toLowerCase() ||
              m.width !== sample.width ||
              m.height !== sample.height ||
              m.bytes !== sample.bytes
            )
              throw Error("Sample integrity mismatch");
            bytes = b;
            reused = "verified-sample";
          } catch (e) {
            row.sampleError = e.message;
          }
        }
        row.attempts = 0;
        if (!bytes && offline) row.status = "uncollected";
        if (!bytes && !offline)
          for (let attempt = 0; attempt <= retries; attempt++) {
            row.attempts++;
            try {
              await throttle();
              const response = await fetcher(row.source, {
                redirect: "error",
                signal: AbortSignal.timeout(timeout),
              });
              if (!response.ok) {
                const e = Error(`HTTP ${response.status}`);
                e.status = response.status;
                const retryAfter = response.headers.get("retry-after");
                e.retryAfter = retryAfter
                  ? Math.max(
                      0,
                      Math.min(
                        15000,
                        Number.isFinite(Number(retryAfter))
                          ? Number(retryAfter) * 1000
                          : Date.parse(retryAfter) - Date.now(),
                      ),
                    )
                  : 0;
                await response.body?.cancel();
                throw e;
              }
              const chunks = [];
              let size = 0;
              for await (const chunk of response.body) {
                size += chunk.length;
                if (size > 30_000_000) throw Error("Image exceeds 30MB limit");
                chunks.push(chunk);
              }
              bytes = Buffer.concat(chunks);
              inspect(bytes);
              break;
            } catch (e) {
              bytes = undefined;
              row.status = [404, 410].includes(e.status) ? "missing" : "failed";
              row.error = e.message;
              if (
                row.status === "missing" ||
                (e.status &&
                  e.status < 500 &&
                  ![408, 429].includes(e.status)) ||
                attempt === retries
              )
                break;
              await pause(
                Math.max(
                  e.retryAfter || 0,
                  Math.min(15000, 1000 * 2 ** attempt),
                ),
              );
            }
          }
        if (bytes) {
          try {
            Object.assign(row, inspect(bytes), {
              status: "success",
              reused: reused || "download",
            });
            delete row.error;
            row.local = `objects/${row.sha256}.bin`;
            await writeFile(
              resolve(dir, `${row.local}.${sha(row.source).slice(0, 12)}.next`),
              bytes,
            );
            await replaceFile(
              resolve(dir, `${row.local}.${sha(row.source).slice(0, 12)}.next`),
              resolve(dir, row.local),
            );
          } catch (e) {
            row.status = "failed";
            row.error = e.message;
          }
        }
        await save();
      }
    }
    // A checkpoint failure must not release the directory lock while another
    // worker is still fetching/writing. Promise.all rejects before those settle.
    const results = await Promise.allSettled(
      Array.from({ length: concurrency }, worker),
    );
    const failure = results.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;
    const seen = new Map();
    for (const row of rows.filter((r) => r.status === "success")) {
      if (seen.has(row.sha256)) row.duplicateOf = seen.get(row.sha256);
      else seen.set(row.sha256, row.source);
    }
    await save();
    const report = {
      total: rows.length,
      successful: rows.filter((r) => r.status === "success").length,
      uniqueBinaries: seen.size,
      duplicates: rows.filter((r) => r.duplicateOf).length,
      missing: rows.filter((r) => r.status === "missing").length,
      failed: rows.filter((r) => r.status === "failed").length,
      uncollected: rows.filter((r) => r.status === "uncollected").length,
    };
    await writeFile(
      resolve(dir, "report.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
    return report;
  } finally {
    await lock.close();
    const { unlink } = await import("node:fs/promises");
    await unlink(resolve(dir, "recovery.lock"));
  }
}
async function runCli() {
  const args = process.argv.slice(2);
  if (args.some((a) => !["--offline"].includes(a)))
    throw Error(
      "Only --offline is supported; storage is fixed to ignored .tmp/photo-recovery",
    );
  console.log(
    await recover({
      albums: await json("docs/legacy-snapshot/gallery-index.json"),
      samples: await json("docs/legacy-snapshot/gallery-manifest.json"),
      offline: args.includes("--offline"),
    }),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  runCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
