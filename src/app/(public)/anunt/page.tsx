import { Container } from "@mui/material";
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
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <AnuntWizard />
    </Container>
  );
}
