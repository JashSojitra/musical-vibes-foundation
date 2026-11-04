import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Read the site's typed media records, without introducing another content dataset.
const { outputText } = ts.transpileModule(
  readFileSync("src/data/media.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
);
const { mediaAssets } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
export const publicDemoMedia = mediaAssets.filter(
  (item) =>
    item.publicationStatus === "published" && item.approval === "approved",
);
assert(publicDemoMedia.length > 0, "No public approved media available");
for (const item of publicDemoMedia)
  assert(
    /^\/assets\/curated\/[a-z0-9-]+\.webp$/.test(item.src),
    "Unexpected media path",
  );
export const publicDemoAssetPaths = [
  ...publicDemoMedia.map((item) => item.src),
  "/assets/legacy/logo.png",
];
