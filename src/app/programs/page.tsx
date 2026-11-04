import { getMedia as getIntroMedia } from "@/lib/content";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { Invitation, PageIntro } from "@/components/ui";
import ProgramExplorer from "@/components/program-explorer";
export const metadata = pageMetadata(
  "Our Programs",
  "Explore six ways to connect through music, mindful living, senior engagement, learning, and community food support.",
  "/programs",
);
export default async function Programs() {
  const { programs, media } = await getSiteContent();
  const intro = await getIntroMedia("song");
  return (
    <>
      <PageIntro
        artwork={{
          src: intro.src,
          alt: intro.alt,
          label: "Expression. Connection. Belonging.",
        }}
        eyebrow="OUR PROGRAMS / FIND YOUR RHYTHM"
        title="Six ways to connect."
        emphasis="So much to share."
        description="Music. Movement. Conversation. Care. Explore the programs that bring our community together."
        number="02"
      />
      {programs.length ? (
        <ProgramExplorer programs={programs} media={media} />
      ) : (
        <p className="wrap">Program information will be shared soon.</p>
      )}
      <section className="programs-note wrap">
        <span className="large-asterisk" aria-hidden="true">
          ✳
        </span>
        <div>
          <h2>Not sure where to begin?</h2>
          <p>
            We’re happy to talk through the programs with you. Contact us for
            current availability, schedules, and participation details.
          </p>
        </div>
      </section>
      <Invitation title="Find a rhythm" emphasis="that feels like you." />
    </>
  );
}
