import handler from "../.open-next-demo/worker.js";
import { demoHeaders } from "./demo-headers.mjs";
export * from "../.open-next-demo/worker.js";

const worker = {
  async fetch(request, env, ctx) {
    const response = await handler.fetch(request, env, ctx);
    const staged = new Response(response.body, response);
    for (const [name, value] of Object.entries(demoHeaders)) {
      staged.headers.set(name, value);
    }
    return staged;
  },
};
export default worker;
