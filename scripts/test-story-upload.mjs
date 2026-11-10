/** Local fixture: real input component, mocked Sanity transport, no credentials or network. */
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { strict as assert } from "node:assert";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createServer } from "node:http";

const directory = await mkdtemp(join(process.cwd(), ".tmp/upload-"));
const mock = join(directory, "sanity.ts");
await writeFile(
  mock,
  `
export const setIfMissing = (value) => ({type:'initial', value});
export const insert = (items) => ({type:'insert', items});
export const set = (value,path) => ({type:'set',value,path});
const failed = new Set();
export const useClient = () => ({observable:{assets:{upload:(_,file)=>({subscribe(observer){
 setTimeout(()=>{
 if(['retry.png','clear.png'].includes(file.name) && !failed.has(file.name)){failed.add(file.name);observer.error(new Error('Fixture upload failure'));return;}
 observer.next({type:'progress',percent:50});
 observer.next({type:'response',body:{document:{_id:'image-fixture-100x100-png'}}});
 observer.complete();
 },10);
}})}}});
`,
);
const entry = join(directory, "entry.tsx");
await writeFile(
  entry,
  `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {StoryPhotosInput} from '${process.cwd()}/studio/components/StoryPhotosInput';
function Fixture(){
 const [value,change]=useState([{_key:'existing',caption:'Existing photograph',cover:true}]);
 return <><StoryPhotosInput id="fixture" value={value} onChange={(patches)=>change(previous=>{
 let next=[...previous];
 for(const p of patches){if(p.type==='insert') next.push(...p.items);if(p.type==='set')next=next.map(item=>item._key===p.path[0]._key?{...item,cover:p.value}:item);}
 return next;
 })} renderDefault={()=> <p>Native Sanity editor retained</p>}/><pre id="value">{JSON.stringify(value)}</pre></>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`,
);
const result = await build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  jsx: "automatic",
  alias: { react: join(process.cwd(), "node_modules/react") },
  plugins: [
    {
      name: "mock-sanity",
      setup(b) {
        b.onResolve({ filter: /^sanity$/ }, () => ({ path: mock }));
      },
    },
  ],
});
const server = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end(
    `<div id="root"></div><script>${result.outputFiles[0].text}</script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", (error) => console.error(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const files = Array.from({ length: 24 }, (_, i) => ({
    name: i === 5 ? "retry.png" : `photo-${i}.png`,
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=",
      "base64",
    ),
  }));
  await page.locator("input[type=file]").setInputFiles(files);
  await page.getByText("Upload failed", { exact: false }).waitFor();
  await page.waitForFunction(
    () => document.querySelectorAll("input[type=radio]").length === 24,
  );
  await page.getByRole("button", { name: "Retry retry.png" }).click();
  await page.waitForFunction(
    () => document.querySelectorAll("input[type=radio]").length === 25,
  );
  const value = JSON.parse(await page.locator("#value").textContent());
  assert.equal(value[0]._key, "existing");
  assert.equal(new Set(value.map((v) => v._key)).size, 25);
  assert.ok(value.slice(1).every((v) => v.asset._type === "reference"));
  await page.getByRole("radio").nth(4).check();
  const covers = JSON.parse(await page.locator("#value").textContent());
  assert.equal(covers.filter((v) => v.cover).length, 1);
  assert.equal(covers[4].cover, true);
  await page
    .locator("input[type=file]")
    .setInputFiles([
      {
        name: "clear.png",
        mimeType: "image/png",
        buffer: Buffer.from("fixture"),
      },
    ]);
  await page.getByRole("button", { name: "Clear error" }).click();
  assert.equal(
    JSON.parse(await page.locator("#value").textContent()).length,
    25,
  );
  await page
    .getByRole("button", { name: "Clear error" })
    .waitFor({ state: "detached" });
  console.log(
    "PASS: 24-file picker, failed upload/retry/clear, keyed persistence, existing photo preserved, exactly one cover.",
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
