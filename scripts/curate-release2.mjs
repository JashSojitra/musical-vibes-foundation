import fs from "node:fs/promises";
import sharp from "sharp";
const manifest = JSON.parse(
  await fs.readFile("docs/legacy-snapshot/gallery-manifest.json", "utf8"),
);
const selection = {
  conversation: ["25_12_4_Seniors_Club/2.jpg", 1600],
  gathering: ["25_11_13_Seniors_Club/1.jpg", 1600],
  "diwali-portrait": ["25_10_16_Diwali_Celebrations/2.jpg", 1200],
  speaker: ["Oct_2_2025_Seniors_Club/1.jpg", 1600],
  "june-song": ["June1925/1.jpg", 1400],
  "picnic-table": ["Aug_21_2025_Seniors_club/2.jpeg", 1600],
  march: ["Mar_19_2025_seniors_club/1.jpg", 1600],
};
const derivatives = [];
for (const [name, [sourcePath, width]] of Object.entries(selection)) {
  const asset = manifest.find((item) =>
    item.source.endsWith("/assets/" + sourcePath),
  );
  if (!asset) throw new Error(`Missing source ${sourcePath}`);
  const local = `public/assets/curated/${name}.webp`;
  const info = await sharp(asset.local)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(local);
  derivatives.push({
    local,
    original: asset.local,
    source: asset.source,
    ...info,
    consent: "unconfirmed",
  });
}
await fs.writeFile(
  "docs/legacy-snapshot/release2-curated-manifest.json",
  JSON.stringify(derivatives, null, 2) + "\n",
);
