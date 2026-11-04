import { getMedia } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import {
  Eyebrow,
  Invitation,
  PageIntro,
  Photo,
  TextLink,
} from "@/components/ui";
export const metadata = pageMetadata(
  "Our Story",
  "Discover the empathy, empowerment, and community at the heart of Musical Vibes Foundation.",
  "/about",
);
export default async function About() {
  const picnic = await getMedia("picnic"),
    portrait = await getMedia("june-song"),
    circle = await getMedia("circle");
  const intro = await getMedia("circle");
  return (
    <>
      <PageIntro
        artwork={{
          src: intro.src,
          alt: intro.alt,
          label: "A place in the circle",
        }}
        eyebrow="OUR STORY / OUR SHARED RHYTHM"
        title="A foundation built"
        emphasis="on togetherness."
        description="Music, wellness, and compassion. A simple belief that everyone deserves connection."
        number="01"
      />
      <section className="about-opening wrap">
        <Photo media={picnic} priority caption />
        <div className="about-opening-note">
          <span aria-hidden="true">✳</span>
          <p>
            Different stories.
            <br />A shared sense of belonging.
          </p>
        </div>
      </section>
      <section className="about-story wrap">
        <Eyebrow>WHY WE’RE HERE</Eyebrow>
        <div>
          <h2 data-reveal>
            Connection is a human need.
            <br />
            <em>Let’s make room for it.</em>
          </h2>
          <p className="lead">
            Musical Vibes Foundation is a nonprofit organisation based in
            Brampton, Ontario, bringing music, wellness, and community support
            together.
          </p>
          <p>
            Our work responds to the emotional and social challenges people
            face, with seniors at its heart. Through shared experiences, mindful
            practices, and opportunities for self-expression, we create spaces
            where people can feel included and valued.
          </p>
          <p>
            From music and Seniors Club gatherings to learning and charitable
            outreach, our purpose is rooted in care for one another.
          </p>
        </div>
      </section>
      <section className="about-values wrap">
        <div className="values-heading">
          <Eyebrow>WHAT GUIDES US</Eyebrow>
          <h2 data-reveal>
            A little more care.
            <br />
            <em>In everything we do.</em>
          </h2>
        </div>
        <div className="values-list">
          {[
            {
              title: "Empathy",
              body: "Understanding the challenges seniors face and responding with care and meaningful support.",
            },
            {
              title: "Empowerment",
              body: "Creating space for people to express themselves, learn, and lead fulfilling lives.",
            },
            {
              title: "Community",
              body: "Building a network of support and connection so people feel less alone.",
            },
          ].map((value, i) => (
            <article key={value.title} data-reveal>
              <span>0{i + 1}</span>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="about-people wrap">
        <Photo media={portrait} caption />
        <div>
          <Eyebrow>WHO WE SERVE</Eyebrow>
          <h2 data-reveal>
            Seniors at the heart.
            <br />
            <em>Community all around.</em>
          </h2>
          <p>
            We recognise the loneliness and isolation seniors can experience.
            Our programs create opportunities to share a song, join a
            conversation, celebrate, and take part.
          </p>
          <p>
            Our compassion extends into the wider community through food support
            and charitable initiatives.
          </p>
          <TextLink href="/programs">Discover our programs</TextLink>
        </div>
      </section>
      <section className="about-community">
        <Photo media={circle} />
        <div className="about-community-quote">
          <Eyebrow>THIS IS WHAT CONNECTION LOOKS LIKE</Eyebrow>
          <h2>
            Room for a conversation.
            <br />
            <em>A place in the circle.</em>
          </h2>
          <TextLink href="/gallery">Explore our community archive</TextLink>
        </div>
      </section>
      <Invitation title="Be part of" emphasis="the connection." />
    </>
  );
}
