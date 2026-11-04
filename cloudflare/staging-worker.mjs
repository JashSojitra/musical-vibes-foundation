import handler from "../.open-next-staging/worker.js";
import { stagingHeaders } from "./staging-headers.mjs";
export * from "../.open-next-staging/worker.js";

const worker = {
  async fetch(request, env, ctx) {
    const response = await handler.fetch(request, env, ctx);
    const staged = new Response(response.body, response);
    for (const [name, value] of Object.entries(stagingHeaders)) {
      staged.headers.set(name, value);
    }
    return staged;
  },
};
export default worker;
