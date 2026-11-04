import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Local typed content changes on deployment. No persistent ISR store is needed.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
