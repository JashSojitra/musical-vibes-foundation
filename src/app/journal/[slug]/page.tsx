import ArrowIcon from "@/components/arrow-icon";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
export function generateStaticParams() {
  return getPublicContent()
    .getJournalEntries()
    .map((entry) => ({ slug: entry.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const entry = getPublicContent().getJournalEntry((await params).slug);
  if (!entry) return {};
  const photo = getPublicContent().getEntryPhotos(entry)[0];
  return {
    ...pageMetadata(
      entry.title,
      entry.excerpt,
      `/journal/${entry.slug}`,
      photo?.src ?? "/assets/legacy/logo.png",
    ),
    openGraph: {
      ...pageMetadata(
        entry.title,
        entry.excerpt,
        `/journal/${entry.slug}`,
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
  const adapter = getPublicContent();
  const entry = adapter.getJournalEntry((await params).slug);
  if (!entry) notFound();
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
          image: photos.map((photo) => settings.url + photo.src),
          mainEntityOfPage: settings.url + `/journal/${entry.slug}`,
        }}
      />
      <article className="journal-article wrap">
        <Breadcrumbs
          items={[
            { label: "Journal", href: "/journal" },
            { label: entry.title },
          ]}
        />
        <header>
          <Eyebrow>FROM THE COMMUNITY ARCHIVE</Eyebrow>
          <h1 data-title>{entry.title}</h1>
          <p className="journal-meta">
            Archive note published{" "}
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
        <div className="journal-article-body">
          <div>
            {entry.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {collection ? (
              <TextLink href={collectionHref(collection.id)}>
                Explore this story in photographs
              </TextLink>
            ) : null}
          </div>
          <aside>
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
            <TextLink href="/journal">Back to the Journal</TextLink>
          </aside>
        </div>
      </article>
    </>
  );
}
