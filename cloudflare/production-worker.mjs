import handler from "../.open-next-production/worker.js";
import { legacyRedirect } from "./production-routing.mjs";
export * from "../.open-next-production/worker.js";
const worker = {
  async fetch(request, env, ctx) {
    const redirect = legacyRedirect(request);
    if (redirect) return redirect;
    const response = await handler.fetch(request, env, ctx);
    const result = new Response(response.body, response);
    // CMS reads remain fresh; immutable Next assets retain their own caching.
    if (!new URL(request.url).pathname.startsWith("/_next/static/"))
      result.headers.set("Cache-Control", "no-store");
    return result;
  },
};

export default worker;
