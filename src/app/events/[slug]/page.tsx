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
export const dynamicParams = false;
export async function generateStaticParams() {
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
  return (
    <>
      <header className="event-detail-intro wrap">
        <Breadcrumbs
          items={[{ label: "Events", href: "/events" }, { label: event.title }]}
        />
        <Eyebrow>FROM THE ARCHIVE / PAST GATHERING</Eyebrow>
        <h1 data-title>{event.title}</h1>
        <div className="event-facts">
          <div>
            <span className="eyebrow">WHEN WE GATHERED</span>
            <time dateTime={event.date}>{event.dateLabel}</time>
          </div>
          {event.location ? (
            <div>
              <span className="eyebrow">WHERE</span>
              <p>{event.location}</p>
            </div>
          ) : null}
          <div>
            <span className="eyebrow">SOURCE COLLECTION</span>
            <p>{event.sourceAlbum}</p>
          </div>
        </div>
      </header>
      <div className="event-detail-photo wrap">
        <Photo media={image} priority />
      </div>
      <section className="event-detail-story wrap">
        <Eyebrow>A MOMENT SHARED</Eyebrow>
        <div>
          <h2 data-reveal>
            More than a gathering.
            <br />
            <em>A shared memory.</em>
          </h2>
          <p className="lead">{event.description}</p>
          <p>
            This page looks back at a past community gathering from the
            foundation’s original photo archive. For current plans and ways to
            participate, we’d love to hear from you.
          </p>
          <Action href="/contact">Ask about future gatherings</Action>
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
        <TextLink href="/events">Back to all events</TextLink>
        <TextLink href="/gallery">Explore the full gallery</TextLink>
      </div>
      <Invitation />
    </>
  );
}
