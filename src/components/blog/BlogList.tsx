"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useSupabase } from "@/hooks/useSupabase";
import { listPublishedPosts, type BlogPostWithAuthor } from "@/services/blog.service";
import { BlogCard } from "./BlogCard";
import { BlogSkeleton } from "./BlogSkeleton";

interface BlogListProps {
  initial: BlogPostWithAuthor[];
  initialTotal: number;
  pageSize?: number;
  tag?: string;
}

export function BlogList({ initial, initialTotal, pageSize = 9, tag }: BlogListProps) {
  const supabase = useSupabase();
  const [posts, setPosts] = useState<BlogPostWithAuthor[]>(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length < initialTotal);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadNext = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const result = await listPublishedPosts(supabase, {
        page: nextPage,
        limit: pageSize,
        tag,
      });
      setPosts((prev) => [...prev, ...result.data]);
      setPage(nextPage);
      setHasMore(nextPage < result.totalPages);
    } catch {
      /* network failure — sentinel will retry on next intersection */
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, pageSize, tag, supabase]);

  // IntersectionObserver-based infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadNext();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNext]);

  if (posts.length === 0 && !loading) {
    return (
      <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
        Nu există articole publicate momentan.
      </Typography>
    );
  }

  return (
    <section aria-label="Articole blog">
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
          },
          gap: 3,
        }}
        component="ul"
        role="list"
        style={{ listStyle: "none", padding: 0, margin: 0 }}
      >
        {posts.map((post, index) => (
          <li key={post.id}>
            <BlogCard post={post} priority={index === 0} />
          </li>
        ))}
      </Box>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div
          ref={sentinelRef}
          aria-hidden="true"
          style={{ height: 1 }}
        />
      )}

      {/* Screen-reader live region announces loading / end */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {loading && "Se încarcă mai multe articole…"}
        {!hasMore && posts.length > 0 && "Toate articolele au fost încărcate."}
      </div>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-hidden="true">
          <CircularProgress size={32} />
        </Box>
      )}

      {/* Skeleton placeholder while first append loads */}
      {loading && posts.length === 0 && <BlogSkeleton count={pageSize} />}
    </section>
  );
}
