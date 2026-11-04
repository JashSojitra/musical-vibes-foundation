import type { NextConfig } from "next";
const config: NextConfig = {
  // Freeze the source per build: a static demo cannot be switched into CMS mode at runtime.
  env: {
    CONTENT_SOURCE:
      process.env.CONTENT_SOURCE ||
      (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ? "" : "local"),
  },
  images: {
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/6jpdhhxg/production/**",
      },
    ],
  },
  poweredByHeader: false,
};
export default config;
