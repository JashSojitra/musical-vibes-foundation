import Link from "next/link";
import { getPublicContent } from "@/lib/journal";
import { notFound } from "next/navigation";
import { getEvent, getEvents, getMedia } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import {
  Action,
  Breadcrumbs,
  Eyebrow,
  Invitation,
  Photo,
  TextLink,
} from "@/components/ui";
// New CMS slugs must render on request, never enter on-demand static generation.
export const dynamic = "force-dynamic";
export const dynamicParams = true;
export async function generateStaticParams() {
  if (process.env.CONTENT_SOURCE === "sanity") return [];
  return (await getEvents()).map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  return event
    ? pageMetadata(event.title, event.description, `/events/${slug}`)
    : {};
}
export default async function EventDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    event = await getEvent(slug);
  if (!event) notFound();
  const image = await getMedia(event.imageId);
  const stories = (await getPublicContent())
    .getJournalEntries()
    .filter((entry) => entry.eventId === event.id);
  return (
    <>
      <header className="event-detail-intro wrap">
        <Breadcrumbs
          items={[{ label: "Events", href: "/events" }, { label: event.title }]}
        />
        <Eyebrow>
          {event.status === "past"
            ? "FROM THE ARCHIVE / PAST GATHERING"
            : "UPCOMING GATHERING"}
        </Eyebrow>
        <h1 data-title>{event.title}</h1>
        <div className="event-facts">
          <div>
            <span className="eyebrow">
              {event.status === "past" ? "WHEN WE GATHERED" : "WHEN WE GATHER"}
            </span>
            <time dateTime={event.date}>{event.dateLabel}</time>
          </div>
          {event.location ? (
            <div>
              <span className="eyebrow">WHERE</span>
              <p>{event.location}</p>
            </div>
          ) : null}
          {event.sourceAlbum ? (
            <div>
              <span className="eyebrow">SOURCE COLLECTION</span>
              <p>{event.sourceAlbum}</p>
            </div>
          ) : null}
        </div>
      </header>
      <div className="event-detail-photo wrap">
        <Photo media={image} priority />
      </div>
      <section className="event-detail-story wrap">
        <Eyebrow>
          {event.status === "past" ? "A MOMENT SHARED" : "A MOMENT TO SHARE"}
        </Eyebrow>
        <div>
          <h2 data-reveal>
            {event.status === "past"
              ? "More than a gathering."
              : "Come share a moment."}
            <br />
            <em>
              {event.status === "past"
                ? "A shared memory."
                : "You're welcome here."}
            </em>
          </h2>
          <p className="lead">{event.description}</p>
          <p>
            {event.status === "past"
              ? "This page looks back at a past community gathering from the foundation’s original photo archive. For current plans and ways to participate, we’d love to hear from you."
              : "For details about attending this gathering, please contact the foundation."}
          </p>
          <Action href="/contact">
            {event.status === "past"
              ? "Ask about future gatherings"
              : "Ask about this gathering"}
          </Action>
        </div>
      </section>
      {event.galleryIds.length > 1 ? (
        <section
          className="event-detail-gallery wrap"
          aria-label="Photographs from this gathering"
        >
          {await Promise.all(
            event.galleryIds.map(async (id) => (
              <Photo key={id} media={await getMedia(id)} caption />
            )),
          )}
        </section>
      ) : null}
      <div className="event-back wrap">
        {stories.map((story) => (
          <Link key={story.id} href={`/journal/${story.slug}`}>
            Read {story.title} in the Journal
          </Link>
        ))}
        <TextLink href="/events">Back to all events</TextLink>
        <TextLink href="/gallery">Explore the full gallery</TextLink>
      </div>
      <Invitation />
    </>
  );
}
