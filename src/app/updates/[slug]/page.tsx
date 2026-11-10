import EditorialBody from "@/components/editorial-body";
import ArrowIcon from "@/components/arrow-icon";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublicContent, journalDate } from "@/lib/journal";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import {
  Breadcrumbs,
  Eyebrow,
  StructuredData,
  TextLink,
} from "@/components/ui";
import { collectionHref } from "@/components/gallery-preview";
// New CMS slugs must render on request, never enter on-demand static generation.
export const dynamic = "force-dynamic";
export async function generateStaticParams() {
  if (process.env.CONTENT_SOURCE === "sanity") return [];
  return (await getPublicContent())
    .getJournalEntries()
    .map((entry) => ({ slug: entry.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const requestedSlug = (await params).slug;
  const entry = (await getPublicContent()).getJournalEntry(requestedSlug);
  if (!entry) return {};
  if (entry.slug !== requestedSlug) permanentRedirect(`/updates/${entry.slug}`);
  const photo = (await getPublicContent()).getEntryPhotos(entry)[0];
  return {
    ...pageMetadata(
      entry.seoTitle || entry.title,
      entry.seoDescription || entry.excerpt,
      `/updates/${entry.slug}`,
      photo?.src ?? "/assets/legacy/logo.png",
    ),
    openGraph: {
      ...pageMetadata(
        entry.seoTitle || entry.title,
        entry.seoDescription || entry.excerpt,
        `/updates/${entry.slug}`,
        photo?.src ?? "/assets/legacy/logo.png",
      ).openGraph,
      type: "article",
      publishedTime: entry.publishedAt,
    },
  };
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const adapter = await getPublicContent();
  const requestedSlug = (await params).slug;
  const entry = adapter.getJournalEntry(requestedSlug);
  if (!entry) notFound();
  if (entry.slug !== requestedSlug) permanentRedirect(`/updates/${entry.slug}`);
  const archive = entry.id.startsWith("journal.event.");
  const photos = adapter.getEntryPhotos(entry),
    event = adapter.getEntryEvent(entry),
    programs = adapter.getEntryPrograms(entry);
  const collection = adapter
    .getGalleryCollections()
    .find((item) => item.journalId === entry.id);
  const { settings } = await getSiteContent();
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: entry.title,
          description: entry.excerpt,
          datePublished: entry.publishedAt,
          author: { "@type": "Organization", name: settings.name },
          publisher: { "@type": "Organization", name: settings.name },
          image: photos.map((photo) => new URL(photo.src, settings.url).href),
          mainEntityOfPage: settings.url + `/updates/${entry.slug}`,
        }}
      />
      <article className="journal-article wrap">
        <Breadcrumbs
          items={[
            { label: "Updates", href: "/updates" },
            { label: entry.title },
          ]}
        />
        <header>
          <Eyebrow>
            {archive ? "FROM THE COMMUNITY ARCHIVE" : "UPDATES & STORIES"}
          </Eyebrow>
          <h1 data-title>{entry.title}</h1>
          <p className="journal-meta">
            {archive ? "Archive note published" : "Published"}{" "}
            <time dateTime={entry.publishedAt}>
              {journalDate(entry.publishedAt)}
            </time>
            {event ? (
              <>
                {" "}
                · Gathering:{" "}
                <time dateTime={event.date}>{event.dateLabel}</time>
              </>
            ) : null}
          </p>
        </header>
        {photos[0] ? (
          <figure className="journal-article-photo">
            <Image
              src={photos[0].src}
              alt={photos[0].alt}
              width={photos[0].width}
              height={photos[0].height}
              priority
              sizes="(max-width:700px) 88vw, 85vw"
            />
            <figcaption>{photos[0].caption}</figcaption>
          </figure>
        ) : null}
        {photos.length > 1 ? (
          <section
            className="event-detail-gallery"
            aria-label="More photographs from this update"
          >
            {photos.slice(1).map((photo) => (
              <figure key={photo.id}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width:700px) 88vw, 40vw"
                />
                {photo.caption ? (
                  <figcaption>{photo.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </section>
        ) : null}
        <div className="journal-article-body">
          <div>
            <EditorialBody body={entry.body} paragraphs={entry.paragraphs} />
            {collection ? (
              <TextLink href={collectionHref(collection.id)}>
                Explore this story in photographs
              </TextLink>
            ) : null}
          </div>
          <aside>
            {event ? (
              <TextLink href={`/events/${event.slug}`}>
                Related event: {event.title}
              </TextLink>
            ) : null}
            {programs.length ? (
              <>
                <Eyebrow>RELATED PROGRAMS</Eyebrow>
                {programs.map((program) => (
                  <Link key={program.id} href={`/programs/${program.slug}`}>
                    {program.title}
                    <span aria-hidden="true">
                      <ArrowIcon />
                    </span>
                  </Link>
                ))}
              </>
            ) : null}
            <TextLink href="/updates">Back to Updates</TextLink>
          </aside>
        </div>
      </article>
    </>
  );
}
