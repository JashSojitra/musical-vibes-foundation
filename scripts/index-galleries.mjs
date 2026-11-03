import fs from 'node:fs/promises';
const script = await fs.readFile('docs/legacy-snapshot/gallery.js','utf8');
const albums = [...script.matchAll(/"([^"\n]+)"\s*:\s*\[([\s\S]*?)\]/g)].map(([,title,body])=>{
  const paths = [...body.matchAll(/"(\.\.\/assets\/[^"\n]+)"/g)].map(m=>m[1]);
  const unique = [...new Set(paths)];
  return {title, references:paths.length, duplicates:paths.length-unique.length, photos:unique.filter(p=>/\.(jpe?g|webp|png)$/i.test(p)), videos:unique.filter(p=>/\.mp4$/i.test(p)), malformed:unique.filter(p=>! /\.(jpe?g|webp|png|mp4)$/i.test(p)), review:'Source classification only; all rights and consent unconfirmed'};
});
await fs.writeFile('docs/legacy-snapshot/gallery-index.json',JSON.stringify(albums,null,2)+'\n');
console.log(albums.map(a=>`${a.title}: ${a.photos.length} photos, ${a.videos.length} videos, ${a.duplicates} duplicates, ${a.malformed.length} malformed`).join('\n'));
