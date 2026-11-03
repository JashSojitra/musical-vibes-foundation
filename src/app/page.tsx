import Home from "@/components/home";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "The Art of Connection",
  "Music, wellness, and meaningful connection for seniors and our wider community in Brampton, Ontario.",
  "/",
);
export default function Page() {
  return <Home />;
}
