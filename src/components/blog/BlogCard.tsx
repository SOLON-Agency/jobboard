"use client";

import Image from "next/image";
import Link from "next/link";
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { formatDate } from "@/lib/blog/markdown";
import { BlogTagChip } from "./BlogTagChip";
import type { BlogPostWithAuthor } from "@/services/blog.service";

interface BlogCardProps {
  post: BlogPostWithAuthor;
  /** When true the cover image gets priority/eager loading (use for the first card). */
  priority?: boolean;
}

export function BlogCard({ post, priority = false }: BlogCardProps) {
  const authorName = post.profiles?.full_name ?? "Echipa JurisJobs";
  const href = `/blog/${post.slug}`;

  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, border-color 0.2s",
        "&:hover": {
          boxShadow: 4,
          borderColor: "primary.main",
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={href}
        sx={{ display: "flex", flexDirection: "column", alignItems: "stretch", flexGrow: 1 }}
        aria-label={`Citește articolul: ${post.title}`}
      >
        {/* Cover image */}
        {post.cover_image_url ? (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              overflow: "hidden",
              bgcolor: "action.hover",
            }}
          >
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              aspectRatio: "16 / 9",
              bgcolor: "primary.main",
              opacity: 0.08,
            }}
          />
        )}

        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2.5 }}>
          {/* Tags */}
          {post.tags.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
              {post.tags.slice(0, 3).map((tag) => (
                <BlogTagChip key={tag} tag={tag} size="small" />
              ))}
              {post.tags.length > 3 && (
                <Chip label={`+${post.tags.length - 3}`} size="small" sx={{ borderRadius: 1 }} />
              )}
            </Stack>
          )}

          {/* Title */}
          <Typography
            variant="h6"
            component="h2"
            fontWeight={700}
            sx={{
              mb: 1,
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.title}
          </Typography>

          {/* Excerpt */}
          {post.excerpt && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                flexGrow: 1,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.6,
              }}
            >
              {post.excerpt}
            </Typography>
          )}

          {/* Meta row */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            sx={{ mt: "auto" }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Admin
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              {post.published_at && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <CalendarTodayIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                  <Typography variant="caption" color="text.secondary">
                    <time dateTime={post.published_at}>
                      {formatDate(post.published_at)}
                    </time>
                  </Typography>
                </Stack>
              )}
              {post.reading_time_minutes && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AccessTimeIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                  <Typography variant="caption" color="text.secondary">
                    {post.reading_time_minutes} min
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
