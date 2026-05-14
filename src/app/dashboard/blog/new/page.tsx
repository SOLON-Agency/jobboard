import type { Metadata } from "next";
import { Typography } from "@mui/material";
import { assertFeatureEnabled } from "@/lib/feature-flags";
import { requireAdminRole } from "@/lib/server-guards";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { AddEditBlogPost } from "@/components/forms/AddEditBlogPost";
import { BlogBackButton } from "@/components/blog/BlogBackButton";
import { createPost } from "@/app/dashboard/blog/actions";

export const metadata: Metadata = { title: "Articol nou" };

export default async function NewBlogPostPage() {
  assertFeatureEnabled("blog");
  await requireAdminRole();

  return (
    <>
      <DashboardPageHeader
        title={
          <Typography variant="h5" fontWeight={700} component="h1">
            Articol nou
          </Typography>
        }
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Creează un articol nou pentru blog
          </Typography>
        }
        actions={<BlogBackButton />}
      />
      <AddEditBlogPost
        onSave={async (data) => {
          "use server";
          return createPost(data);
        }}
      />
    </>
  );
}
