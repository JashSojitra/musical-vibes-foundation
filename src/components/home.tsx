import { getSiteContent, getMedia } from "@/lib/content";
import { Action, Eyebrow, Invitation } from "./ui";
import JournalPreview from "./journal-preview";
import LivingSymphony from "./experience/living-symphony";
import ProgramJourney from "./experience/program-journey";
import CommunityMemories from "./experience/community-memories";

export default async function Home() {
  const { programs, media } = await getSiteContent();
  const picnic = await getMedia("picnic");
  const singer = await getMedia("june-song");
  const circle = await getMedia("circle");
  return (
    <>
      <LivingSymphony singer={singer} circle={circle} picnic={picnic} />

      <ProgramJourney programs={programs} media={media} />
      <CommunityMemories
        photos={[
          media.find((photo) => photo.id === "diwali")!,
          picnic,
          media.find((photo) => photo.id === "christmas")!,
        ]}
      />

      <JournalPreview />

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
