import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConsentScreen } from "./ConsentScreen";

interface SearchParams {
  client_id?: string;
  client_name?: string;
  client_logo?: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  response_type?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function OAuthConsentPage({ searchParams }: Props) {
  const params = await searchParams;
  const {
    client_id,
    client_name,
    client_logo,
    redirect_uri,
    scope,
    state,
    response_type,
  } = params;

  // Reject malformed requests immediately
  if (!client_id || !redirect_uri || response_type !== "code") {
    redirect("/login?error=invalid_oauth_request");
  }

  // Require the user to be authenticated; preserve the full consent URL after login
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const returnUrl = `/oauth/consent?${new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      ) as Record<string, string>
    ).toString()}`;
    redirect(`/login?redirect=${encodeURIComponent(returnUrl)}`);
  }

  const scopes = (scope ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <ConsentScreen
      userEmail={user.email ?? ""}
      clientId={client_id}
      clientName={client_name ?? client_id}
      clientLogo={client_logo}
      redirectUri={redirect_uri}
      scopes={scopes}
      state={state ?? ""}
    />
  );
}
