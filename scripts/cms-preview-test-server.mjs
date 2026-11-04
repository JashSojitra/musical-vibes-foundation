// Local test harness only. Never imported by or deployed with the Worker.
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { createServer } from "node:http";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { validateConfig } from "./cms-preview-config.mjs";
const config = validateConfig();
const live = process.argv.includes("--live");
let documents = [];
let queries = 0;
const dry = resolve(".tmp/cms-preview-dry-run");
const entry = readdirSync(dry).find((name) =>
  /^cms-preview-worker\.(js|mjs)$/.test(name),
);
if (!entry) throw new Error("Run cf:dry-run:cms-preview first");
const mf = new Miniflare(
  convertV4MiniflareOptions({
    name: config.name,
    modules: true,
    scriptPath: resolve(dry, entry),
    modulesRoot: dry,
    compatibilityDate: config.compatibility_date,
    compatibilityFlags: config.compatibility_flags,
    bindings: config.vars,
    assets: {
      directory: resolve(config.assets.directory),
      binding: "ASSETS",
      routerConfig: { has_user_worker: true },
    },
    images: { binding: "IMAGES" },
    outboundService: async (request) => {
      const url = new URL(request.url);
      if (url.hostname === "6jpdhhxg.api.sanity.io") {
        if (
          request.headers.has("authorization") ||
          request.method !== "GET" ||
          !url.pathname.endsWith("/data/query/production") ||
          url.searchParams.get("perspective") !== "published"
        )
          throw new Error(
            "Unexpected Sanity access: public published GET queries only",
          );
        queries++;
        return live
          ? fetch(request.url)
          : new Response(JSON.stringify({ result: documents, ms: 1 }), {
              headers: { "content-type": "application/json" },
            });
      }
      if (url.hostname === "cdn.sanity.io" && !live)
        return new Response(
          readFileSync("public/assets/curated/shared-song.webp"),
          { headers: { "content-type": "image/webp" } },
        );
      throw new Error(`Unexpected outbound request: ${url.hostname}`);
    },
  }),
);
const server = createServer(async (req, res) => {
  try {
    if (!live && req.url === "/__fixture" && req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      documents = JSON.parse(Buffer.concat(chunks).toString());
      res.end("ok");
      return;
    }
    if (req.url === "/__queries") {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ queries }));
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const response = await mf.dispatchFetch(
      `http://127.0.0.1:${live ? 3014 : 3013}${req.url}`,
      {
        method: req.method,
        redirect: "manual",
        headers: req.headers,
        ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
      },
    );
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error.message);
    res.writeHead(500);
    res.end("Local harness error");
  }
});
server.listen(live ? 3014 : 3013, "127.0.0.1", () =>
  console.log(
    `CMS preview ${live ? "public live read" : "fixture"} workerd test harness ready`,
  ),
);
async function stop() {
  server.close();
  await mf.dispose();
  process.exit();
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
