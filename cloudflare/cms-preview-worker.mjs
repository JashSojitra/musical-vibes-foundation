import handler from "../.open-next-cms-preview/worker.js";
import { demoHeaders } from "./demo-headers.mjs";
export * from "../.open-next-cms-preview/worker.js";

const worker = {
  async fetch(request, env, ctx) {
    const response = await handler.fetch(request, env, ctx);
    const preview = new Response(response.body, response);
    for (const [name, value] of Object.entries(demoHeaders))
      preview.headers.set(name, value);
    if (!new URL(request.url).pathname.startsWith("/_next/static/"))
      preview.headers.set("Cache-Control", "no-store");
    return preview;
  },
};
export default worker;
