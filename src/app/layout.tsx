import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Musical Vibes Foundation | Music, Wellness & Community',
  description: 'Supporting seniors and strengthening community through music, wellness, connection, and charitable programs in Brampton, Ontario.',
  metadataBase: new URL('https://www.musicalvibesfoundation.com'),
  alternates: {canonical:'/'},
  openGraph: {title:'Musical Vibes Foundation | Find Your Joy', description:'Music, wellness, and community connection in Brampton, Ontario.', type:'website', locale:'en_CA', url:'/', images:[{url:'/assets/curated/community-picnic.webp', width:1600, height:1066, alt:'Musical Vibes Seniors Club together at a community picnic'}]},
  twitter: {card:'summary_large_image', title:'Musical Vibes Foundation', images:['/assets/curated/community-picnic.webp']},
  robots: {index:true, follow:true}
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
