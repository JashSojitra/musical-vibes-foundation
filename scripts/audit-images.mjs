import fs from 'node:fs/promises';
import sharp from 'sharp';
const records = JSON.parse((await fs.readFile('docs/legacy-snapshot/gallery-manifest.json', 'utf8')).replace(/^\uFEFF/, ''));
const tiles = [];
for (const [i, asset] of records.entries()) {
  const meta = await sharp(asset.local).metadata();
  asset.width = meta.width; asset.height = meta.height;
  const thumb = await sharp(asset.local).rotate().resize(230, 160, { fit: 'contain', background: '#eee' }).png().toBuffer();
  const label = Buffer.from(`<svg width="240" height="35"><text x="5" y="17" font-size="12">${i}: ${asset.album.slice(0, 25)}</text><text x="5" y="31" font-size="11">${meta.width} × ${meta.height}</text></svg>`);
  tiles.push({ input: await sharp({ create: { width: 240, height: 200, channels: 3, background: '#eee' } }).composite([{ input: thumb, left: 0, top: 0 }, { input: label, left: 0, top: 163 }]).png().toBuffer(), left: (i % 5) * 240, top: Math.floor(i / 5) * 200 });
}
await sharp({ create: { width: 1200, height: Math.ceil(records.length / 5) * 200, channels: 3, background: '#eee' } }).composite(tiles).jpeg().toFile('docs/legacy-snapshot/contact-sheet.jpg');
await fs.writeFile('docs/legacy-snapshot/gallery-manifest.json', JSON.stringify(records, null, 2) + '\n');
