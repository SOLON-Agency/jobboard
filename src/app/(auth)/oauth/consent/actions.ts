"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function approve(formData: FormData) {
  const redirectUri = formData.get("redirect_uri") as string;
  const state = formData.get("state") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const code = session?.access_token ?? "";

  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);

  redirect(url.toString());
}

export async function deny(formData: FormData) {
  const redirectUri = formData.get("redirect_uri") as string;
  const state = formData.get("state") as string;

  const url = new URL(redirectUri);
  url.searchParams.set("error", "access_denied");
  url.searchParams.set("error_description", "The user denied access");
  if (state) url.searchParams.set("state", state);

  redirect(url.toString());
}
