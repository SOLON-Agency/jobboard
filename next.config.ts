import type { NextConfig } from "next";
import withVercelToolbar from "@vercel/toolbar/plugins/next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/companies/:slug",
        destination: "/societate/:slug",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uccivcdtfpevtykirkuw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Allow any HTTPS hostname for blog cover images and other external URLs.
      // Editors may link images from arbitrary CDNs; next/image still optimises them.
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default withVercelToolbar()(nextConfig);
