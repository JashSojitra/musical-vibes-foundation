import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { historicalAlbumSources } from "./photo-import-plan.mjs";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const snapshot = "docs/legacy-snapshot";
const index = read(`${snapshot}/gallery-index.json`);
const inventory = read(`${snapshot}/photo-recovery-inventory.json`);
const output = "src/data/archive-index.json";
const originals = new Map(inventory.photos.map((row) => [row.source, row]));
const origin = "https://www.musicalvibesfoundation.com";
const months = "jan feb mar apr may jun jul aug sep oct nov dec".split(" ");
const albums = index.map(({ title, photos }) => {
  const [, month, day, year] =
    title.match(/ \(([a-z]+) +(\d{1,2}),? *(\d{4})\)$/i) ?? [];
  const monthNumber = months.indexOf(month?.slice(0, 3).toLowerCase()) + 1;
  assert(month && monthNumber, `Unrecognized archive date: ${title}`);
  const date = `${year}-${String(monthNumber).padStart(2, "0")}-${day.padStart(2, "0")}`;
  assert.equal(new Date(date).toISOString().slice(0, 10), date);
  const digest = createHash("sha256").update(title).digest("hex").slice(0, 32);
  const story = historicalAlbumSources[title];
  const paths = photos.map((path) => path.replace(/^\.\.\/assets\//, ""));
  return {
    id: story ? `journal-collection.${story}` : `historical-album.${digest}`,
    title,
    date,
    photos: paths.map((path, order) => {
      const row = originals.get(new URL(`/assets/${path}`, origin).href);
      if (row?.status === "success") {
        assert(
          row.associations.some(
            (item) => item.album === title && item.order === order,
          ),
        );
      }
      return [path, row?.status === "success" ? row.sha1 : null];
    }),
  };
});
const serialized = JSON.stringify(albums, null, 2) + "\n";
if (process.argv.includes("--check"))
  assert.equal(readFileSync(output, "utf8"), serialized);
else writeFileSync(output, serialized);

// Optional verification against a read-only GROQ export of approved public albums.
const exportPath = process.argv
  .find((arg) => arg.startsWith("--public-export="))
  ?.split("=")[1];
if (exportPath) {
  const published = read(exportPath).result;
  const assets = new Set();
  const issues = [];
  for (const album of albums) {
    const live = published.find((row) => row.sourceId === album.id);
    if (live?.albumPhotos.length !== album.photos.length)
      issues.push(`${album.id}: position count differs`);
    album.photos.forEach(([path, hash], order) => {
      const position = live?.albumPhotos[order];
      if (!position?.exists || !hash || position.ref?.split("-")[1] !== hash)
        issues.push(path);
      else assets.add(position.ref);
    });
  }
  console.log(
    JSON.stringify(
      {
        albums: albums.length,
        positions: albums.flatMap((a) => a.photos).length,
        verifiedOriginals: assets.size,
        issues,
      },
      null,
      2,
    ),
  );
  assert.equal(issues.length, 0);
}
