import type { Metadata } from "next";
import { Suspense } from "react";
import { Box, Container, Typography } from "@mui/material";
import { assertFeatureEnabled } from "@/lib/feature-flags";
import { createStaticClient } from "@/lib/supabase/static";
import { listPublishedPosts } from "@/services/blog.service";
import { BlogList } from "@/components/blog/BlogList";
import { BlogSkeleton } from "@/components/blog/BlogSkeleton";
import appSettings from "@/config/app.settings.json";

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Articole despre cariera juridică din România: sfaturi pentru avocați, tendințe în recrutare, analize ale pieței juridice.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `Blog | ${appSettings.name}`,
    description:
      "Articole despre cariera juridică, tendințe în recrutare și sfaturi pentru profesioniști din domeniul juridic.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog | ${appSettings.name}`,
    description: "Articole despre cariera juridică din România.",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  assertFeatureEnabled("blog");

  const { tag } = await searchParams;
  const supabase = createStaticClient();
  const first = await listPublishedPosts(supabase, { page: 1, limit: 9, tag }).catch(() => ({
    data: [],
    count: 0,
    page: 1,
    totalPages: 0,
  }));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box component="header" sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography
          variant="h1"
          component="h1"
          fontWeight={800}
          sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" }, mb: 1 }}
        >
          Blog
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Articole despre cariera juridică, tendințe în recrutare și sfaturi pentru
          profesioniști din domeniul juridic din România.
        </Typography>
        {tag && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Etichetă: <strong>{tag}</strong>
          </Typography>
        )}
      </Box>

      <Suspense fallback={<BlogSkeleton count={9} />}>
        <BlogList
          initial={first.data}
          initialTotal={first.count}
          pageSize={9}
          tag={tag}
        />
      </Suspense>
    </Container>
  );
}
