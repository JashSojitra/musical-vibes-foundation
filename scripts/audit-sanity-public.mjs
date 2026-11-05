import { createClient } from "@sanity/client";
import { basename } from "node:path";
import { publicVars } from "./cms-preview-config.mjs";

/** No token, mutation, or permission change. Uses the same project/version/perspective as the Worker. */
export async function auditPublicSanity() {
  const projectId = publicVars.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = publicVars.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = publicVars.NEXT_PUBLIC_SANITY_API_VERSION;
  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    perspective: "published",
  });
  const docs = await client.fetch(
    '*[_type in ["program","event","journalEntry","mediaItem","siteSettings","faq"]]',
    {},
    { cache: "no-store", perspective: "published" },
  );
  const refs = new Set();
  function collect(value) {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") {
      if (typeof value._ref === "string" && value._ref.includes("."))
        refs.add(value._ref);
      Object.values(value).forEach(collect);
    }
  }
  docs.forEach(collect);
  let omitted = [];
  if (refs.size) {
    const response = await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/doc/${dataset}/${[...refs].map(encodeURIComponent).join(",")}`,
      { cache: "no-store" },
    );
    if (!response.ok)
      throw new Error(`Sanity Doc API returned ${response.status}`);
    omitted = (await response.json()).omitted || [];
  }
  return {
    projectId,
    dataset,
    apiVersion,
    perspective: "published",
    counts: Object.fromEntries(
      [
        "program",
        "event",
        "journalEntry",
        "mediaItem",
        "siteSettings",
        "faq",
      ].map((type) => [type, docs.filter((d) => d._type === type).length]),
    ),
    unreadableReferences: omitted,
  };
}

if (basename(process.argv[1] || "") === "audit-sanity-public.mjs") {
  auditPublicSanity()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (report.unreadableReferences.length) {
        console.error(
          "Public content access failed: referenced dotted IDs are private paths. No data was changed.",
        );
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
