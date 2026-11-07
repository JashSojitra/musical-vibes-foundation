import { unavailableMedia } from "@/lib/media-placeholder";
import { getSiteContent, getMedia } from "@/lib/content";
import { Action, Eyebrow, Invitation, TextLink } from "./ui";
import JournalPreview from "./journal-preview";
import LivingSymphony from "./experience/living-symphony";
import ProgramJourney from "./experience/program-journey";
import CommunityMemories from "./experience/community-memories";

export default async function Home() {
  const { programs, events, media, home } = await getSiteContent();
  const picnic = await getMedia("picnic");
  const singer = await getMedia("june-song");
  const circle = await getMedia("circle");
  const featuredEvents = home.featuredEventSlugs.flatMap((slug) =>
    events.filter((event) => event.slug === slug),
  );
  return (
    <>
      <LivingSymphony
        singer={media.find((photo) => photo.id === home.heroImageId) ?? singer}
        circle={circle}
        picnic={picnic}
        home={home}
      />

      <ProgramJourney
        programs={
          process.env.CONTENT_SOURCE === "sanity" &&
          home.featuredProgramSlugs.length
            ? home.featuredProgramSlugs.flatMap((slug) =>
                programs.filter((p) => p.slug === slug),
              )
            : programs
        }
        media={media}
      />
      <CommunityMemories
        photos={[
          media.find((photo) => photo.id === "diwali") ?? unavailableMedia,
          picnic,
          media.find((photo) => photo.id === "christmas") ?? unavailableMedia,
        ]}
      />

      <JournalPreview />
      {featuredEvents.length > 0 && (
        <section className="upcoming-section wrap">
          <Eyebrow>EVENTS & GATHERINGS</Eyebrow>
          {featuredEvents.map((event) => (
            <article key={event.id}>
              <h2>{event.title}</h2>
              <p>{event.dateLabel}</p>
              <p>{event.description}</p>
              <TextLink href={`/events/${event.slug}`}>
                Explore this gathering
              </TextLink>
            </article>
          ))}
        </section>
      )}

      <section className="home-support wrap">
        <Eyebrow>COMPASSION, PUT INTO PRACTICE</Eyebrow>
        <div className="support-overview">
          <h2 data-reveal>
            Bring your time.
            <br />
            Bring your ideas.
            <br />
            <em>Bring your heart.</em>
          </h2>
          <div>
            <p>
              There’s more than one way to make a connection. Volunteer, support
              a community initiative, or explore a collaboration with the
              foundation.
            </p>
            <Action href="/get-involved">Find your way to get involved</Action>
          </div>
        </div>
      </section>
      <Invitation title="Good things happen" emphasis="when we connect." />
    </>
  );
}
