import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemas";

export default defineConfig({
  name: "musical-vibes",
  title: "Musical Vibes Foundation",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "6jpdhhxg",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  scheduledDrafts: { enabled: false },
  releases: { enabled: false },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Foundation content")
          .items([
            S.documentTypeListItem("journalEntry").title("Updates & Stories"),
            S.documentTypeListItem("event").title("Events"),
            S.documentTypeListItem("program").title("Programs"),
            S.documentTypeListItem("mediaItem").title("Photos"),
            S.listItem()
              .title("Homepage")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings")
                  .views([S.view.form()]),
              ),
            S.documentTypeListItem("faq").title("FAQs"),
            S.listItem()
              .title("Site Settings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings"),
              ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter((t) => t.schemaType !== "siteSettings"),
  },
  document: {
    actions: (actions, context) =>
      context.schemaType === "siteSettings"
        ? actions.filter(
            (a) =>
              a.action !== "duplicate" &&
              a.action !== "delete" &&
              a.action !== "unpublish",
          )
        : actions,
  },
});
