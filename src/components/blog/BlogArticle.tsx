import Image from "next/image";
import Link from "next/link";
import { Box, Breadcrumbs, Container, Divider, Stack, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { formatDate, extractHeadings } from "@/lib/blog/markdown";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TableOfContents } from "./TableOfContents";
import { BlogTagChip } from "./BlogTagChip";
import type { BlogPostWithAuthor } from "@/services/blog.service";

interface BlogArticleProps {
  post: BlogPostWithAuthor;
}

export function BlogArticle({ post }: BlogArticleProps) {
  const authorName = post.profiles?.full_name ?? "Echipa JurisJobs";
  const headings = extractHeadings(post.content_markdown);
  const hasToc = headings.length >= 2;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="Cale navigare"
        sx={{ mb: 3, fontSize: "0.875rem" }}
      >
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
          Acasă
        </Link>
        <Link href="/blog" style={{ color: "inherit", textDecoration: "none" }}>
          Blog
        </Link>
        <Typography variant="body2" color="text.primary" noWrap sx={{ maxWidth: "100%" }}>
          {post.title}
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: hasToc ? { xs: "1fr", lg: "1fr minmax(240px, 280px)" } : "1fr",
          gap: { xs: 0, lg: 6 },
          alignItems: "start",
        }}
      >
        {/* Main content */}
        <article>
          <header>
            {/* Tags */}
            {post.tags.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
                {post.tags.map((tag) => (
                  <BlogTagChip key={tag} tag={tag} linked />
                ))}
              </Stack>
            )}

            <Typography
              variant="h1"
              component="h1"
              fontWeight={800}
              sx={{
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
                lineHeight: 1.25,
                mb: 3,
              }}
            >
              {post.title}
            </Typography>

            {post.excerpt && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 2.5, fontSize: "1.0625rem", lineHeight: 1.7 }}
              >
                {post.excerpt}
              </Typography>
            )}

            {/* Meta */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ sm: "center" }}
              spacing={{ xs: 1, sm: 3 }}
              sx={{ mb: 3 }}
              component="div"
            >
              <address style={{ fontStyle: "normal" }}>
                <Typography variant="body2" fontWeight={600}>
                  De{" "}
                  {/* <span rel="author">{authorName}</span> */}
                  <span rel="author">Admin</span>
                </Typography>
              </address>
              {post.published_at && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <CalendarTodayIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary">
                    <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                  </Typography>
                </Stack>
              )}
              {post.reading_time_minutes && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AccessTimeIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary">
                    {post.reading_time_minutes} min lectură
                  </Typography>
                </Stack>
              )}
            </Stack>

            {/* Cover image */}
            {post.cover_image_url && (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  borderRadius: 2,
                  overflow: "hidden",
                  mb: 4,
                }}
              >
                <Image
                  src={post.cover_image_url}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, (max-width: 1200px) 66vw, 900px"
                  style={{ objectFit: "cover" }}
                />
              </Box>
            )}
          </header>

          {/* Table of contents on mobile */}
          {hasToc && (
            <Box sx={{ display: { xs: "block", lg: "none" }, mb: 4 }}>
              <TableOfContents headings={headings} variant="inline" />
            </Box>
          )}

          {/* Article body */}
          <Box sx={{ maxWidth: 760 }}>
            <MarkdownRenderer markdown={post.content_markdown} />
          </Box>

          {/* Footer */}
          <Divider sx={{ my: 4 }} />
          <footer>
            {post.tags.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Etichete:
                </Typography>
                {post.tags.map((tag) => (
                  <BlogTagChip key={tag} tag={tag} linked />
                ))}
              </Stack>
            )}
          </footer>
        </article>

        {/* Table of contents on desktop */}
        {hasToc && (
          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              flexDirection: "column",
              alignSelf: "stretch",
              minHeight: 0,
            }}
          >
            <TableOfContents headings={headings} variant="sidebar" />
          </Box>
        )}
      </Box>
    </Container>
  );
}
