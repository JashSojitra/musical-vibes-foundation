import handler from "../.open-next-production/worker.js";
import { securityHeaders } from "./demo-headers.mjs";
import { legacyRedirect } from "./production-routing.mjs";
export * from "../.open-next-production/worker.js";
const worker = {
  async fetch(request, env, ctx) {
    const redirect = legacyRedirect(request);
    const response = redirect || (await handler.fetch(request, env, ctx));
    const result = new Response(response.body, response);
    for (const [name, value] of Object.entries(securityHeaders))
      result.headers.set(name, value);
    // CMS reads remain fresh; immutable Next assets retain their own caching.
    if (!new URL(request.url).pathname.startsWith("/_next/static/"))
      result.headers.set("Cache-Control", "no-store");
    return result;
  },
};

export default worker;
