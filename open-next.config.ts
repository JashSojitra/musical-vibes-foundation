import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Local mode uses deployment assets. Sanity mode uses request-time reads with no persistent ISR cache.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
