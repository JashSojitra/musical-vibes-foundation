import { notFound, permanentRedirect } from "next/navigation";
import { getPublicContent } from "@/lib/journal";
export const dynamic = "force-dynamic";
export default async function JournalRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const entry = (await getPublicContent()).getJournalEntry((await params).slug);
  if (!entry) notFound();
  permanentRedirect(`/updates/${entry.slug}`);
}
