import ArrowIcon from "@/components/arrow-icon";
import { getMedia } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import {
  Action,
  Eyebrow,
  Invitation,
  PageIntro,
  Photo,
  TextLink,
} from "@/components/ui";
export const metadata = pageMetadata(
  "Get Involved",
  "Volunteer, support a community initiative, explore collaboration, or take part in a Musical Vibes Foundation program.",
  "/get-involved",
);
export default async function GetInvolved() {
  const photo = await getMedia("picnic-table");
  return (
    <>
      <PageIntro
        eyebrow="GET INVOLVED / BRING YOUR HEART"
        title="Your next connection"
        emphasis="could start here."
        description="A little time, a thoughtful idea, a willingness to help. There’s more than one way to be part of our community."
        number="05"
      />
      <section className="involved-feature wrap">
        <div>
          <Eyebrow>01 / SHARE YOUR TIME</Eyebrow>
          <h2 data-reveal>
            Kindness is
            <br />
            <em>a team effort.</em>
          </h2>
          <h3>Volunteer with the foundation</h3>
          <p>
            Tell us about your interests, experience, and availability. The
            foundation can share its current needs and help you explore a way to
            contribute.
          </p>
          <Action href="/contact?interest=volunteer">
            Talk to us about volunteering
          </Action>
        </div>
        <Photo media={photo} priority caption />
      </section>
      <section className="involved-paths wrap">
        <article className="theme-sage" data-reveal>
          <Eyebrow>02 / CARE IN ACTION</Eyebrow>
          <h2>
            Support an
            <br />
            <em>initiative.</em>
          </h2>
          <p>
            From community food support to shared activities, start a
            conversation about the foundation’s current needs. Please arrange
            contributions directly with the team.
          </p>
          <TextLink href="/contact?interest=support">
            Find out how to help
          </TextLink>
          <span className="path-symbol" aria-hidden="true">
            ♡
          </span>
        </article>
        <article className="theme-rose" data-reveal>
          <Eyebrow>03 / CREATE SOMETHING TOGETHER</Eyebrow>
          <h2>
            Connect through
            <br />
            <em>collaboration.</em>
          </h2>
          <p>
            Have an idea for working together? We welcome conversations with
            people and organisations who share an interest in music, wellness,
            and community.
          </p>
          <TextLink href="/contact?interest=collaboration">
            Start a partnership conversation
          </TextLink>
          <span className="path-symbol" aria-hidden="true">
            <ArrowIcon />
          </span>
        </article>
      </section>
      <section className="participate-section wrap">
        <Eyebrow>04 / SIMPLY BE PART OF IT</Eyebrow>
        <h2 data-reveal>
          Come for the music.
          <br />
          <em>Stay for the connection.</em>
        </h2>
        <p>
          Explore the programs and ask about current opportunities to
          participate. A shared experience is a good place to begin.
        </p>
        <Action href="/programs">Find your program</Action>
      </section>
      <Invitation title="Bring what makes you" emphasis="beautifully you." />
    </>
  );
}
