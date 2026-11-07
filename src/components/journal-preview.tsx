import { getSiteContent } from "@/lib/content";
import Image from "next/image";
import Link from "next/link";
import { getPublicContent, journalDate } from "@/lib/journal";
import { Eyebrow, TextLink } from "./ui";

export default async function JournalPreview() {
  const adapter = await getPublicContent();
  const { home } = await getSiteContent();
  const all = adapter.getJournalEntries();
  const selected = (home.featuredStoryIds || []).flatMap((id) =>
    all.filter((entry) => entry.id === id),
  );
  const flagged = all.filter((entry) => entry.featuredOnHome);
  const entries = (
    selected.length ? selected : flagged.length ? flagged : all
  ).slice(0, 3);
  if (!entries.length) return null;
  return (
    <section
      className="journal-preview wrap"
      aria-labelledby="journal-preview-title"
    >
      <div className="section-heading">
        <div>
          <Eyebrow>THE COMMUNITY JOURNAL</Eyebrow>
          <h2 id="journal-preview-title">
            Stories that bring us
            <br />
            <em>a little closer.</em>
          </h2>
        </div>
        <TextLink href="/journal">Read the Journal</TextLink>
      </div>
      <div className="journal-preview-list">
        {entries.map((entry) => {
          const photo = adapter.getEntryPhotos(entry)[0];
          return (
            <article key={entry.id}>
              {photo ? (
                <Link
                  href={`/journal/${entry.slug}`}
                  className="journal-preview-image"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width:700px) 88vw, 30vw"
                  />
                </Link>
              ) : null}
              <div>
                <p className="journal-meta">
                  Archive note ·{" "}
                  <time dateTime={entry.publishedAt}>
                    {journalDate(entry.publishedAt)}
                  </time>
                </p>
                <h3>
                  <Link href={`/journal/${entry.slug}`}>{entry.title}</Link>
                </h3>
                <p>{entry.excerpt}</p>
                <TextLink href={`/journal/${entry.slug}`}>
                  Read the story
                </TextLink>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
