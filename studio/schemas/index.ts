import { StoryPhotosInput } from "../components/StoryPhotosInput";
import { defineField, defineType } from "sanity";
import {
  publicReferenceOptions,
  validatePublicReference,
} from "./public-references";

const string = (name: string, title: string, mandatory = true) =>
  defineField({
    name,
    title,
    type: "string",
    validation: (r) => (mandatory ? r.required() : r),
  });
const prose = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "text",
    rows: 3,
    validation: (r) => r.required(),
  });
const references = (name: string, title: string, type: string) =>
  defineField({
    name,
    title,
    type: "array",
    of: [
      {
        type: "reference",
        to: [{ type }],
        options: publicReferenceOptions,
        validation: (r) => r.custom(validatePublicReference),
      },
    ],
    validation: (r) => r.unique(),
  });
const image = defineField({
  name: "image",
  title: "Featured photograph",
  type: "reference",
  to: [{ type: "mediaItem" }],
  options: publicReferenceOptions,
  validation: (r) => r.custom(validatePublicReference),
  description:
    "Select a Media Library record. Only approved, publicly enabled photographs appear on the website.",
});
const identity = [
  defineField({
    name: "sourceId",
    title: "Original stable ID",
    type: "string",
    readOnly: true,
    hidden: true,
  }),
  string("title", "Title"),
  defineField({
    name: "slug",
    title: "Website address",
    type: "slug",
    options: { source: "title", maxLength: 96 },
    validation: (r) =>
      r.required().custom(async (value, context) => {
        if (!value?.current) return true;
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current))
          return "Use lowercase letters, numbers and hyphens.";
        const id = context.document?._id.replace(/^drafts\./, "");
        if (!id) return true;
        const client = context
          .getClient({ apiVersion: "2026-11-01" })
          .withConfig({ perspective: "published", useCdn: false });
        const old = await client.fetch<string | null>(
          "*[_id == $id][0].slug.current",
          { id },
        );
        const history = (context.document?.previousSlugs || []) as string[];
        if (old && old !== value.current && !history.includes(old))
          return `Add "${old}" to Previous addresses before changing this address.`;
        const occupied = await client.fetch<number>(
          "count(*[_type == $type && !(_id in [$id, $draft]) && (slug.current in $slugs || count(previousSlugs[@ in $slugs]) > 0)])",
          {
            type: context.document?._type,
            id,
            draft: `drafts.${id}`,
            slugs: [value.current, ...history],
          },
        );
        return occupied
          ? "This address or a previous address belongs to another document."
          : true;
      }),
    description:
      "Use Generate before first publication. Before changing a published address, copy the old address into Previous addresses.",
  }),
  defineField({
    name: "previousSlugs",
    title: "Previous addresses",
    type: "array",
    of: [
      {
        type: "string",
        validation: (r) => r.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      },
    ],
    validation: (r) => r.unique(),
    description:
      "Keep all earlier slugs here so old links redirect. Enter only the last part, without /updates/, /events/ or /programs/.",
  }),
];
const body = defineField({
  name: "body",
  title: "Full story",
  type: "array",
  validation: (r) => r.required(),
  of: [
    {
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Heading", value: "h2" },
        { title: "Subheading", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            title: "Link",
            type: "object",
            fields: [
              {
                name: "href",
                title: "Web address",
                type: "url",
                validation: (r) =>
                  r.required().uri({
                    scheme: ["http", "https", "mailto", "tel"],
                    allowRelative: true,
                  }),
              },
            ],
          },
        ],
      },
    },
  ],
});
const choice = (
  name: string,
  title: string,
  values: string[],
  initialValue?: string,
) =>
  defineField({
    name,
    title,
    type: "string",
    options: { list: values },
    initialValue,
    validation: (r) => r.required(),
  });

export const schemaTypes = [
  defineType({
    name: "journalEntry",
    title: "Update or story",
    type: "document",
    initialValue: () => ({
      slug: { _type: "slug", current: `story-${crypto.randomUUID()}` },
    }),
    fieldsets: [
      {
        name: "details",
        title: "More options & website address",
        options: { collapsible: true, collapsed: true },
      },
    ],
    fields: [
      ...identity,
      prose("excerpt", "Description"),
      { ...body, validation: undefined, title: "Longer story (optional)" },
      choice("kind", "Story type", ["event", "update", "news"], "update"),
      defineField({
        name: "publishedAt",
        title: "Publication date",
        type: "date",
        initialValue: () =>
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Toronto",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date()),
        validation: (r) => r.required(),
        description:
          "The date readers see. Future-dated stories stay hidden until that UTC day (initial date uses America/Toronto); this is not scheduled publishing.",
      }),
      defineField({
        name: "event",
        title: "Related event",
        type: "reference",
        to: [{ type: "event" }],
        options: publicReferenceOptions,
        validation: (r) => r.custom(validatePublicReference),
        description:
          "Optional: connect this story to an event. Gallery does not require one.",
      }),
      references("programs", "Related programs", "program"),
      defineField({
        name: "storyPhotos",
        components: { input: StoryPhotosInput },
        title: "Upload photographs (select multiple files, drag to reorder)",
        type: "array",
        options: { layout: "grid", sortable: true },
        of: [
          {
            type: "image",
            options: { hotspot: true },
            fields: [
              string("alt", "Description (optional)", false),
              string("caption", "Caption (optional)", false),
              defineField({
                name: "decorative",
                title: "Decorative image (silent for screen readers)",
                type: "boolean",
                initialValue: false,
              }),
              defineField({
                name: "cover",
                title: "Use as story cover",
                hidden: true,
                type: "boolean",
                initialValue: false,
              }),
            ],
          },
        ],
        description:
          "Upload 10–20 or more at once. First photo is the cover unless you select one. Files in this dataset are public: upload only photographs you have permission to share.",
        validation: (r) =>
          r.custom((value) =>
            (value || []).filter((p) => (p as { cover?: boolean })?.cover)
              .length > 1
              ? "Choose only one cover photograph."
              : true,
          ),
      }),
      defineField({
        name: "photoRightsConfirmed",
        type: "boolean",
        hidden: true,
        readOnly: true,
        description:
          "Retained legacy value; embedded photos follow the Update publication.",
      }),
      defineField({
        name: "showInGallery",
        title: "Also show this story in Gallery",
        type: "boolean",
        initialValue: true,
      }),
      defineField({
        name: "featuredOnHome",
        title: "Feature on homepage",
        type: "boolean",
        initialValue: false,
      }),
      {
        ...references(
          "photos",
          "Previously published photographs (optional)",
          "mediaItem",
        ),
        description:
          "Reuse existing Photos records without reuploading. Their individual approval settings still apply.",
      },
      defineField({
        name: "seoTitle",
        title: "Search title (optional)",
        type: "string",
        validation: (r) => r.max(70),
      }),
      defineField({
        name: "seoDescription",
        title: "Search description (optional)",
        type: "text",
        validation: (r) => r.max(180),
      }),
    ]
      .map((field) => ({
        ...field,
        fieldset: [
          "slug",
          "previousSlugs",
          "kind",
          "event",
          "programs",
          "photos",
          "seoTitle",
          "seoDescription",
          "body",
        ].includes(field.name)
          ? "details"
          : undefined,
      }))
      .sort((a, b) => {
        const order = [
          "title",
          "excerpt",
          "publishedAt",
          "storyPhotos",
          "showInGallery",
          "featuredOnHome",
        ];
        return (
          (order.includes(a.name) ? order.indexOf(a.name) : 99) -
          (order.includes(b.name) ? order.indexOf(b.name) : 99)
        );
      }),
    preview: { select: { title: "title", subtitle: "publishedAt" } },
  }),
  defineType({
    name: "event",
    title: "Event",
    type: "document",
    fields: [
      ...identity,
      defineField({
        name: "date",
        title: "Gathering date",
        type: "date",
        validation: (r) => r.required(),
        description:
          "Actual event date, separate from a Update's publication date.",
      }),
      string("dateLabel", "Date as displayed", false),
      choice("status", "Event status", ["upcoming", "past"], "upcoming"),
      string("location", "Location", false),
      prose("description", "Description"),
      image,
      references("gallery", "Event photographs", "mediaItem"),
      string("sourceAlbum", "Original archive album", false),
    ],
  }),
  defineType({
    name: "program",
    title: "Program",
    type: "document",
    fields: [
      ...identity,
      string("number", "Display number"),
      string("category", "Category"),
      string("headline", "Page headline"),
      prose("description", "Short description"),
      body,
      defineField({
        name: "focus",
        title: "At the heart of this program",
        type: "array",
        of: [{ type: "string" }],
        validation: (r) => r.required().min(1),
      }),
      image,
      string("imageContext", "Photograph context", false),
      choice(
        "theme",
        "Page colour",
        ["plum", "rose", "sage", "gold", "ivory"],
        "ivory",
      ),
    ],
  }),
  defineType({
    name: "mediaItem",
    title: "Photograph",
    type: "document",
    fields: [
      defineField({
        name: "sourceId",
        type: "string",
        hidden: true,
        readOnly: true,
      }),
      defineField({
        name: "image",
        title: "Original photograph",
        type: "image",
        options: { hotspot: true },
        validation: (r) => r.required(),
        description:
          "Public dataset: uploaded files are public. Never upload consent forms or private documents.",
      }),
      string(
        "alt",
        "Describe the photograph for screen readers (optional)",
        false,
      ),
      defineField({
        name: "decorative",
        title: "Decorative image",
        type: "boolean",
        initialValue: false,
      }),
      string("caption", "Caption", false),
      choice(
        "category",
        "Gallery category",
        ["Music", "Seniors Club", "Celebrations"],
        "Seniors Club",
      ),
      string("source", "Public source / provenance", false),
      string("position", "Legacy focal position", false),
      choice(
        "editorialApproval",
        "Editorial publication approval",
        ["pending", "approved", "rejected"],
        "pending",
      ),
      defineField({
        name: "publicationEnabled",
        title: "Allow on the public website",
        type: "boolean",
        initialValue: false,
        description:
          "Enable only after checking rights and permission outside this public dataset. Approval is also required.",
      }),
      defineField({
        name: "standaloneGallery",
        title: "Also show in the standalone Gallery archive",
        type: "boolean",
        initialValue: false,
        description:
          "Leave off for story-only photographs. Gallery stories appear automatically when the Update is published.",
      }),
      defineField({
        name: "consent",
        title: "Legacy rights status",
        type: "string",
        initialValue: "unconfirmed",
        readOnly: true,
        description:
          "Import preserves unconfirmed rights. Store evidence privately, never here.",
      }),
      defineField({
        name: "migrationHash",
        type: "string",
        hidden: true,
        readOnly: true,
      }),
    ],
    preview: {
      select: { title: "alt", subtitle: "editorialApproval", media: "image" },
    },
  }),
  defineType({
    name: "siteSettings",
    title: "Site Settings",
    type: "document",
    groups: [
      { name: "homepage", title: "Homepage", default: true },
      { name: "contact", title: "Contact & organization" },
    ],
    fields: [
      string("name", "Organization name"),
      defineField({
        name: "url",
        title: "Website URL",
        type: "url",
        validation: (r) => r.required(),
      }),
      string("email", "Contact email"),
      string("phone", "Contact telephone"),
      string("location", "Location"),
      prose("mission", "Mission"),
      defineField({
        name: "socialLinks",
        title: "Social links",
        type: "array",
        of: [
          {
            type: "object",
            fields: [
              string("label", "Name"),
              defineField({
                name: "url",
                title: "Link",
                type: "url",
                validation: (r) => r.required(),
              }),
            ],
          },
        ],
      }),
      string("heroHeadline", "Hero headline", false),
      string("heroEmphasis", "Hero second line", false),
      string("heroDescription", "Hero introduction", false),
      string("heroCtaLabel", "Button text", false),
      defineField({
        name: "heroCtaHref",
        title: "Button destination",
        type: "url",
        validation: (r) =>
          r.uri({ scheme: ["https", "http"], allowRelative: true }),
      }),
      { ...image, name: "heroImage", title: "Hero photograph" },
      references(
        "featuredStories",
        "Featured stories (in order)",
        "journalEntry",
      ),
      references("featuredPrograms", "Featured programs", "program"),
      references("featuredEvents", "Featured events", "event"),
    ].map((field) => ({
      ...field,
      group: [
        "heroHeadline",
        "heroEmphasis",
        "heroDescription",
        "heroCtaLabel",
        "heroCtaHref",
        "heroImage",
        "featuredStories",
        "featuredPrograms",
        "featuredEvents",
      ].includes(field.name)
        ? "homepage"
        : "contact",
    })),
  }),
  defineType({
    name: "faq",
    title: "FAQ",
    type: "document",
    fields: [
      string("question", "Question"),
      prose("answer", "Answer"),
      choice(
        "category",
        "Category",
        ["About us", "Taking part", "Supporting us"],
        "About us",
      ),
      defineField({
        name: "order",
        title: "Display order",
        type: "number",
        initialValue: 0,
        validation: (r) => r.required().integer().min(0),
      }),
    ],
    preview: { select: { title: "question", subtitle: "category" } },
  }),
];
