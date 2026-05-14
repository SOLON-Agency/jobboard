import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Typography } from "@mui/material";
import { assertFeatureEnabled } from "@/lib/feature-flags";
import { requireAdminRole } from "@/lib/server-guards";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/services/blog.service";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { AddEditBlogPost } from "@/components/forms/AddEditBlogPost";
import { BlogBackButton } from "@/components/blog/BlogBackButton";
import { updatePost } from "@/app/dashboard/blog/actions";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const post = await getPostById(supabase, id);
    return { title: `Editează: ${post.title}` };
  } catch {
    return { title: "Editare articol" };
  }
}

export default async function EditBlogPostPage({ params }: Props) {
  assertFeatureEnabled("blog");
  await requireAdminRole();

  const { id } = await params;
  const supabase = await createClient();

  let post;
  try {
    post = await getPostById(supabase, id);
  } catch {
    notFound();
  }

  return (
    <>
      <DashboardPageHeader
        title={
          <Typography variant="h5" fontWeight={700} component="h1">
            Editează articol
          </Typography>
        }
        subtitle={
          <Typography variant="body2" color="text.secondary" noWrap>
            {post.title}
          </Typography>
        }
        actions={<BlogBackButton />}
      />
      <AddEditBlogPost
        initialData={post}
        onSave={async (data, prevStatus) => {
          "use server";
          return updatePost(id, data, prevStatus);
        }}
      />
    </>
  );
}
