import type { Metadata } from "next";
import { Suspense } from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import { ClaimClient } from "./ClaimClient";
import appSettings from "@/config/app.settings.json";

export const metadata: Metadata = {
  title: `Revendică compania — ${appSettings.name}`,
  description: `Preia gratuit controlul asupra profilului companiei tale pe ${appSettings.name} și gestionează anunțurile și candidaturile.`,
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string; code?: string; email?: string }>;
}

async function ClaimPageInner({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ClaimClient
      token={params.token ?? null}
      code={params.code ?? null}
      email={params.email ?? null}
      isAuthenticated={!!user}
    />
  );
}

export default function ClaimPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Box
            role="status"
            aria-label="Se încarcă..."
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <CircularProgress />
          </Box>
        </Container>
      }
    >
      <ClaimPageInner {...props} />
    </Suspense>
  );
}
