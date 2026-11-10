import { createClient } from "@sanity/client";
import { basename } from "node:path";
import { publicVars } from "./cms-preview-config.mjs";
import { referenceOrigins } from "./sanity-reference-origins.mjs";

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
  const origins = referenceOrigins(docs);
  const refs = new Set(origins.map((origin) => origin.ref));
  let omitted = [];
  const ids = [...refs];
  // Bound Doc API URL size as editors add photographs and stories.
  for (let offset = 0; offset < ids.length; offset += 50) {
    const response = await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/doc/${dataset}/${ids
        .slice(offset, offset + 50)
        .map(encodeURIComponent)
        .join(",")}`,
      { cache: "no-store" },
    );
    if (!response.ok)
      throw new Error(`Sanity Doc API returned ${response.status}`);
    omitted.push(...((await response.json()).omitted || []));
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
    unreadableReferenceOrigins: origins.filter((origin) =>
      omitted.some((item) => item.id === origin.ref),
    ),
  };
}

if (basename(process.argv[1] || "") === "audit-sanity-public.mjs") {
  auditPublicSanity()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (report.unreadableReferences.length) {
        console.error(
          "Public content access failed: referenced documents are inaccessible. Review unreadableReferenceOrigins; private-path IDs require an authorized reference repair. No data was changed.",
        );
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
