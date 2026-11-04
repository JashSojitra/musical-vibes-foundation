import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import { organizationSchema } from "@/lib/metadata";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Motion from "@/components/motion";
import { StructuredData } from "@/components/ui";
import "./globals.css";
import "./release3.css";

export const metadata: Metadata = {
  title: {
    default: "The Art of Connection | Musical Vibes Foundation",
    template: "%s | Musical Vibes Foundation",
  },
  description:
    "Music, wellness, and community connection for seniors and the wider community in Brampton, Ontario.",
  metadataBase: new URL("https://www.musicalvibesfoundation.com"),
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Musical Vibes Foundation",
    images: ["/assets/curated/community-picnic.webp"],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: { url: "/assets/legacy/logo.png", type: "image/png" } },
  robots: { index: true, follow: true },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { settings, programs } = await getSiteContent();
  return (
    <html lang="en-CA">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <StructuredData data={organizationSchema} />
        <Navigation
          programs={programs.map(({ title, slug }) => ({ title, slug }))}
        />
        <Motion>
          <main id="main" tabIndex={-1}>
            {children}
          </main>
        </Motion>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
