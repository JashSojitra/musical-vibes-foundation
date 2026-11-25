import { writeFile } from "node:fs/promises";
import sharp from "sharp";

// Keep the complete circular artwork and trim the surrounding rectangular background.
const branding = "public/assets/branding";
const symbol = await sharp(`${branding}/musical-vibes-foundation-logo.png`)
  .extract({ left: 304, top: 48, width: 928, height: 928 })
  .png()
  .toBuffer();
await sharp(symbol)
  .resize(480)
  .webp({ quality: 90 })
  .toFile(`${branding}/musical-vibes-foundation-mark.webp`);

async function png(size) {
  // A proportional fit on a transparent square keeps the full hands and clef.
  return sharp(symbol)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

await writeFile("public/favicon-16x16.png", await png(16));
await writeFile("src/app/icon.png", await png(32));
await writeFile("src/app/apple-icon.png", await png(180));

// ICO directory with lossless PNG frames (supported by modern browsers/OSes).
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map(png));
const directory = Buffer.alloc(6 + 16 * frames.length);
directory.writeUInt16LE(1, 2); // ICO, not CUR
directory.writeUInt16LE(frames.length, 4);
let offset = directory.length;
for (const [index, frame] of frames.entries()) {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index];
  directory[entry + 1] = sizes[index];
  directory.writeUInt16LE(1, entry + 4); // colour planes
  directory.writeUInt16LE(32, entry + 6); // RGBA
  directory.writeUInt32LE(frame.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
}
await writeFile("src/app/favicon.ico", Buffer.concat([directory, ...frames]));
