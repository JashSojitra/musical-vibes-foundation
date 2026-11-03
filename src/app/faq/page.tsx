import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { Invitation, PageIntro, StructuredData } from "@/components/ui";
import FAQExplorer from "@/components/faq-explorer";
export const metadata = pageMetadata(
  "Questions & Answers",
  "Find answers about Musical Vibes Foundation programs, participation, events, volunteering, and getting in touch.",
  "/faq",
);
export default async function FAQ() {
  const { faqs } = await getSiteContent();
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
      <PageIntro
        eyebrow="A FEW HELPFUL ANSWERS"
        title="Curiosity is"
        emphasis="a good beginning."
        description="Here are a few things you might like to know. If your question isn’t here, we’re only a conversation away."
        number="07"
      />
      <section
        className="faq-content wrap"
        aria-label="Search questions and answers"
      >
        <FAQExplorer items={faqs} />
      </section>
      <Invitation title="Still have a question?" emphasis="Let’s talk." />
    </>
  );
}
