import fs from 'node:fs/promises';
import sharp from 'sharp';
const manifest = JSON.parse(await fs.readFile('docs/legacy-snapshot/gallery-manifest.json', 'utf8'));
const selection = {
  'community-picnic':'Aug_21_2025_Seniors_club/3.jpeg',
  'shared-song':'Feb_26_2025_seniors_club/11.jpg',
  'seniors-circle':'jan_15_2025_seniors_club/1.jpg',
  'diwali':'25_10_16_Diwali_Celebrations/1.jpg',
  'celebration':'25_12_8_Seniors_Club/2.jpg',
};
await fs.mkdir('public/assets/curated', { recursive:true });
const derivatives = [];
for (const [name, originalPath] of Object.entries(selection)) {
  const source = manifest.find(asset=>asset.source.endsWith(`/assets/${originalPath}`));
  if (!source) throw new Error(`Missing required source photograph: ${originalPath}`);
  const local = `public/assets/curated/${name}.webp`;
  const info = await sharp(source.local).rotate().resize({width:1800, withoutEnlargement:true}).webp({quality:85}).toFile(local);
  derivatives.push({local, original:source.local, source:source.source, bytes:info.size, width:info.width, height:info.height, consent:'Unconfirmed; local design review only'});
}
await fs.writeFile('docs/legacy-snapshot/curated-manifest.json', JSON.stringify(derivatives,null,2)+'\n');
