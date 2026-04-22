import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Box, Typography, CircularProgress } from "@mui/material";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobList } from "@/components/jobs/JobList";
import appSettings from "@/config/app.settings.json";

export const metadata: Metadata = {
  title: "Locuri de muncă juridice",
  description:
    "Răsfoiește sute de locuri de muncă pentru avocați, juriști și consilieri juridici. Filtrează după locație, tip de contract, salariu și beneficii.",
  alternates: { canonical: "/jobs" },
  openGraph: {
    title: `Locuri de muncă juridice | ${appSettings.name}`,
    description:
      "Răsfoiește locuri de muncă pentru profesioniști juridici din România. Aplică direct la firmele de top.",
    url: "/jobs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Locuri de muncă juridice | ${appSettings.name}`,
    description:
      "Răsfoiește locuri de muncă pentru profesioniști juridici din România.",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
  },
};

export default function JobsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: "1.5rem", md: "1.75rem" },
          fontWeight: 700,
          mb: 3,
          color: "text.primary",
        }}
      >
        Locuri de muncă juridice
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
          gap: { xs: 2, md: 3 },
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            position: { md: "sticky" },
            top: { md: "calc(64px + 16px)" },
            maxHeight: { md: "calc(100vh - 64px - 32px)" },
            overflowY: { md: "auto" },
          }}
        >
          <Suspense
            fallback={
              <Box role="status" aria-label="Se încarcă filtrele..." sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            }
          >
            <JobFilters />
          </Suspense>
        </Box>
        <Suspense
          fallback={
            <Box role="status" aria-label="Se încarcă anunțurile..." sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          }
        >
          <JobList />
        </Suspense>
      </Box>
    </Container>
  );
}
