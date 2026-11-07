import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { CmsDocument } from "../src/lib/sanity-model";

/** Offline inventory of an authenticated export. No client, token, writes, or automatic repair. */
export function legacyDuplicates(documents: CmsDocument[]) {
  const published = documents.filter(
    (d) => !d._id.startsWith("drafts.") && !d._id.startsWith("versions."),
  );
  return published
    .filter((d) => d._id.includes(".") && !d._id.startsWith("sanity."))
    .map((legacy) => ({
      legacyId: legacy._id,
      candidates: published
        .filter(
          (d) =>
            d._id !== legacy._id &&
            d._type === legacy._type &&
            ((d.sourceId && d.sourceId === (legacy.sourceId || legacy._id)) ||
              (legacy.slug?.current &&
                d.slug?.current === legacy.slug.current)),
        )
        .map((d) => d._id),
    }));
}
async function main() {
  const file = process.argv[2];
  if (!file || process.argv.length !== 3)
    throw Error(
      "Usage: tsx scripts/sanity-duplicates.ts <export.ndjson|documents.json>; offline report only",
    );
  const raw = await readFile(file, "utf8");
  const documents = raw.trim().startsWith("[")
    ? JSON.parse(raw)
    : raw
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
  console.log(JSON.stringify(legacyDuplicates(documents), null, 2));
}

if (basename(process.argv[1] || "") === "sanity-duplicates.ts") {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
