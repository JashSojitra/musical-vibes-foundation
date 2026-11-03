/** Read-only public gallery sampler; no third-party URLs or video downloads. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const base = 'https://www.musicalvibesfoundation.com';
const snapshot = 'docs/legacy-snapshot';
const destination = 'public/assets/legacy';
await fs.mkdir(snapshot,{recursive:true});
await fs.mkdir(destination,{recursive:true});
async function download(url) {
  const response = await fetch(url,{signal:AbortSignal.timeout(40000)});
  if(!response.ok) throw new Error(`${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}
const script = await download(`${base}/javascript/gallery.js`);
await fs.writeFile(`${snapshot}/gallery.js`,script);
const paths = [...script.toString().matchAll(/"\.\.\/assets\/([^"\r\n]+\.(?:jpg|jpeg|webp))"/g)].map(m=>m[1]);
const groups = Map.groupBy([...new Set(paths)], p=>p.split('/')[0]);
const selected = [...groups.values()].flatMap(group=>group.slice(0,3));
const records = [], errors = [];
for(let offset=0;offset<selected.length;offset+=4) {
  await Promise.all(selected.slice(offset,offset+4).map(async asset=>{
    const source = `${base}/assets/${asset}`;
    try {
      const bytes = await download(source);
      const local = `${destination}/${path.basename(asset.replaceAll('/','--'))}`;
      await fs.writeFile(local,bytes);
      records.push({source,local,album:asset.split('/')[0],bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase()});
    } catch(error) { errors.push({source,error:String(error)}); }
  }));
}
records.sort((a,b)=>selected.indexOf(a.source.replace(`${base}/assets/`,''))-selected.indexOf(b.source.replace(`${base}/assets/`,'')));
await fs.writeFile(`${snapshot}/gallery-manifest.json`,JSON.stringify(records,null,2)+'\n');
await fs.writeFile(`${snapshot}/gallery-errors.json`,JSON.stringify(errors,null,2)+'\n');
console.log(`Saved ${records.length} photographs; ${errors.length} failures.`);
