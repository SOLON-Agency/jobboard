import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aofjdbonfqjkosbgzsbx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
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

export default nextConfig;
