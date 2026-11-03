import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgram, getPrograms, getMedia } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import {
  Action,
  Arrow,
  Breadcrumbs,
  Eyebrow,
  Invitation,
  Photo,
  StructuredData,
} from "@/components/ui";
export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getPrograms()).map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgram(slug);
  return program
    ? pageMetadata(program.title, program.description, `/programs/${slug}`)
    : {};
}
export default async function ProgramDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    program = await getProgram(slug);
  if (!program) notFound();
  const media = await getMedia(program.imageId),
    programs = await getPrograms(),
    index = programs.findIndex((item) => item.slug === slug),
    next = programs[(index + 1) % programs.length];
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://www.musicalvibesfoundation.com/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Programs",
              item: "https://www.musicalvibesfoundation.com/programs",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: program.title,
              item: `https://www.musicalvibesfoundation.com/programs/${slug}`,
            },
          ],
        }}
      />
      <header className={`program-detail-hero theme-${program.theme} wrap`}>
        <Breadcrumbs
          items={[
            { label: "Programs", href: "/programs" },
            { label: program.title },
          ]}
        />
        <div className="program-detail-heading">
          <div>
            <Eyebrow>
              {program.number} / {program.category}
            </Eyebrow>
            <h1 data-title>{program.headline}</h1>
            <p className="program-official-name">{program.title}</p>
            <Action
              href={`/contact?interest=program&program=${program.slug}`}
              light={program.theme === "plum"}
            >
              Ask about this program
            </Action>
          </div>
          <Photo media={media} priority />
          <span className="program-big-number" aria-hidden="true">
            {program.number}
          </span>
        </div>
        <p className="detail-photo-context">{program.imageContext}</p>
      </header>
      <section className="program-detail-body wrap">
        <div>
          <Eyebrow>A WAY TO CONNECT</Eyebrow>
          <h2 data-reveal>{program.title}</h2>
        </div>
        <div className="program-description">
          <p className="lead">{program.description}</p>
          {program.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <div className="program-focus">
            <h3>At the heart of this program</h3>
            <ul>
              {program.focus.map((item, i) => (
                <li key={item}>
                  <span>0{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="participation-note wrap">
        <Eyebrow>LET’S FIND THE RIGHT NEXT STEP</Eyebrow>
        <div>
          <h2>Curious? You’re welcome here.</h2>
          <p>
            Contact the foundation for current schedules, locations, and
            participation information. We’ll help you learn more about what’s
            available.
          </p>
          <Action href={`/contact?program=${program.slug}`}>
            Start a conversation
          </Action>
        </div>
      </section>
      <Link className="next-program wrap" href={`/programs/${next.slug}`}>
        <span className="eyebrow">KEEP EXPLORING / {next.number}</span>
        <h2>{next.title}</h2>
        <Arrow />
      </Link>
      <Invitation />
    </>
  );
}
