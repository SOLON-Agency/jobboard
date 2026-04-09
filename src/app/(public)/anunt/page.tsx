import { Container, Typography } from "@mui/material";
import type { Metadata } from "next";
import appSettings from "@/config/app.settings.json";
import { AnuntWizard } from "./AnuntWizard";

export const metadata: Metadata = {
  title: `Publică un anunț | ${appSettings.name}`,
  description: `Publică un anunț de angajare pe ${appSettings.name} și găsește candidații juridici potriviți.`,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    siteName: appSettings.name,
    title: `Publică un anunț | ${appSettings.name}`,
    description: `Publică un anunț de angajare pe ${appSettings.name}.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Publică un anunț | ${appSettings.name}`,
  },
};

export default function AnuntPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Typography
        variant="h2"
        fontWeight={900}
        sx={{ mb: 1, letterSpacing: "-0.5px" }}
      >
        Publică un anunț
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 5 }}
      >
        Completează pașii de mai jos pentru a publica anunțul tău de angajare pe {appSettings.name}.
      </Typography>

      <AnuntWizard />
    </Container>
  );
}
