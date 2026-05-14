import type { Metadata } from "next";
import { Alert, Container, Typography } from "@mui/material";
import { assertFeatureEnabled } from "@/lib/feature-flags";
import { requireAdminRole } from "@/lib/server-guards";
import { createClient } from "@/lib/supabase/server";
import { listAllPostsAdmin, type BlogPost } from "@/services/blog.service";
import { countActiveSubscribers } from "@/services/newsletter.service";
import { BlogAdminClient } from "./BlogAdminClient";

export const metadata: Metadata = { title: "Gestionare Blog" };

export default async function BlogAdminPage() {
  assertFeatureEnabled("blog");
  await requireAdminRole();

  const supabase = await createClient();

  let posts: BlogPost[] | undefined;
  let subscriberCount = 0;
  let migrationPending = false;

  try {
    [posts, subscriberCount] = await Promise.all([
      listAllPostsAdmin(supabase),
      countActiveSubscribers(supabase).catch(() => 0),
    ]);
  } catch (err: unknown) {
    // PostgreSQL error code 42P01 = "undefined_table" — migrations not yet applied.
    const pgCode = (err as { code?: string })?.code;
    if (pgCode === "42P01" || (err as { message?: string })?.message?.includes("blog_posts")) {
      migrationPending = true;
      posts = [];
    } else {
      throw err;
    }
  }

  if (migrationPending) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Gestionare Blog
        </Typography>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <strong>Migrarea bazei de date nu a fost aplicată.</strong>
          <br />
          Rulează <code>supabase db push</code> sau{" "}
          <code>node scripts/push-migrations.js</code> pentru a crea tabelele necesare.
        </Alert>
      </Container>
    );
  }

  return <BlogAdminClient initialPosts={posts ?? []} subscriberCount={subscriberCount} />;
}
