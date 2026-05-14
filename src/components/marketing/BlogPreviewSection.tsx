import { Box, Container, Typography } from "@mui/material";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { createStaticClient } from "@/lib/supabase/static";
import { listPublishedPosts } from "@/services/blog.service";
import { BlogPreviewCarousel } from "./BlogPreviewCarousel";
import appSettings from "@/config/app.settings.json";

/**
 * Homepage blog preview. Server component that:
 *   - returns null when the `blog` feature flag is off
 *   - fetches the latest published posts via the anon static client
 *   - returns null if there are no published posts yet (avoids an empty section)
 *
 * RLS: anon can SELECT blog_posts where status='published'.
 */
export async function BlogPreviewSection() {
  if (!isFeatureEnabled("blog")) return null;

  const supabase = createStaticClient();
  let posts: Awaited<ReturnType<typeof listPublishedPosts>>["data"] = [];
  try {
    const result = await listPublishedPosts(supabase, { page: 1, limit: 8 });
    posts = result.data;
  } catch {
    return null;
  }

  if (posts.length === 0) return null;

  return (
    <Box
      component="section"
      aria-labelledby="blog-preview-heading"
      sx={{ bgcolor: "background.default", py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 }, maxWidth: 760, mx: "auto" }}>
          <Typography
            variant="overline"
            sx={{
              color: "primary.main",
              fontWeight: 700,
              letterSpacing: "0.2em",
              display: "block",
              mb: 1.5,
            }}
          >
            Blog {appSettings.name}
          </Typography>
          <Typography
            id="blog-preview-heading"
            variant="h2"
            component="h2"
            sx={{ mb: 2, fontSize: { xs: "1.85rem", sm: "2.2rem", md: "2.6rem", lg: "3rem" } }}
          >
            Idei pentru{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #03170C 0%, #c3ae61 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              cariera ta juridică
            </Box>
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.75, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            Analize, tendințe și sfaturi practice despre piața juridică din România.
            Conținut editorial gândit pentru avocați, juriști și echipele de recrutare.
          </Typography>
        </Box>

        <BlogPreviewCarousel posts={posts} />
      </Container>
    </Box>
  );
}
