import { getSiteContent, getProgram } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { Eyebrow, PageIntro, TextLink } from "@/components/ui";
import ContactForm from "@/components/contact-form";
export const metadata = pageMetadata(
  "Let’s Connect",
  "Contact Musical Vibes Foundation in Brampton, Ontario. Ask about programs, volunteering, collaboration, and community gatherings.",
  "/contact",
);
export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string; program?: string }>;
}) {
  const { settings } = await getSiteContent();
  const query = await searchParams;
  const program = query.program ? await getProgram(query.program) : undefined;
  const interests: Record<string, string> = {
    volunteer: "Volunteering",
    support: "Supporting an initiative",
    collaboration: "Community collaboration",
    program: "Joining a program",
  };
  const initialInterest = program
    ? "Joining a program"
    : (interests[query.interest ?? ""] ?? "General enquiry");
  return (
    <>
      <PageIntro
        eyebrow="CONTACT / LET’S START SOMETHING GOOD"
        title="A hello can change"
        emphasis="the whole day."
        description="A question, an idea, or a wish to get involved. We’re happy to hear from you."
        number="06"
      />
      <section className="contact-layout wrap">
        <div className="contact-details">
          <Eyebrow>REACH THE FOUNDATION</Eyebrow>
          <div className="contact-channel">
            <span>Write to us</span>
            <a href={`mailto:${settings.email}`}>
              {settings.email}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="contact-channel">
            <span>Give us a call</span>
            <a href="tel:+14168326970">
              {settings.phone}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="contact-channel">
            <span>Our community</span>
            <p>{settings.location}</p>
          </div>
          <p className="contact-location-note">
            Program and event locations may vary. Please contact us for details
            before visiting.
          </p>
          <div className="contact-questions">
            <h3>Wondering where to start?</h3>
            <TextLink href="/faq">A few helpful answers</TextLink>
          </div>
        </div>
        <ContactForm
          email={settings.email}
          initialInterest={initialInterest}
          initialMessage={
            program ? `I’d like to learn more about ${program.title}.` : ""
          }
        />
      </section>
    </>
  );
}
