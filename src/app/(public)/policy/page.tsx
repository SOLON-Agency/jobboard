import { Container, Typography, Paper, Box } from "@mui/material";
import type { Metadata } from "next";
import appSettings from "@/config/app.settings.json";

export const metadata: Metadata = {
  title: {
    default: `${appSettings.name} — Politică de confidențialitate`,
    template: `%s | ${appSettings.name}`,
  },
  description: `Politică de confidențialitate și termeni de serviciu pentru ${appSettings.name}.`,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    siteName: appSettings.name,
    title: `${appSettings.name} — Politică de confidențialitate`,
    description: `Politică de confidențialitate și termeni de serviciu pentru ${appSettings.name}.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${appSettings.name} — Politică de confidențialitate`,
  },
};

export default function PolicyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2 }}>
        <Typography variant="h2" sx={{ mb: 4 }}>
          Politică de confidențialitate
        </Typography>

        <Box sx={{ "& h4": { mt: 4, mb: 1.5 }, "& p": { mb: 2 } }}>
          <Typography variant="h4">1. Informații pe care le colectăm</Typography>
          <Typography color="text.secondary">
            Colectăm informații pe care le furnizezi direct către noi, inclusiv numele, adresa de email, CV-ul și orice altă informație pe care o alegi să o furnizezi la crearea unui cont sau la aplicarea pentru un loc de muncă.
          </Typography>

          <Typography variant="h4">2. Cum folosim informațiile tale</Typography>
          <Typography color="text.secondary">
            Folosim informațiile pe care le colectăm pentru a vă furniza, menține și îmbunătăți serviciile noastre, pentru a procesa aplicările pentru locuri de muncă și pentru a vă comunica despre oportunități care corespund preferințelor dumneavoastră.
          </Typography>

          <Typography variant="h4">3. Împărtășirea informațiilor</Typography>
          <Typography color="text.secondary">
            Împărtășim informațiile despre aplicarea dumneavoastră doar cu companiile la care ați aplicat. Nu vândem informațiile personale dumneavoastră terților.
          </Typography>

          <Typography variant="h4">4. Securitatea datelor</Typography>
          <Typography color="text.secondary">
            Implementăm măsuri tehnice și organizatorice adecvate pentru a proteja datele personale împotriva accesului neautorizat, modificării, divulgării sau distrugerii.
          </Typography>

          <Typography variant="h4">5. Drepturile tale</Typography>
          <Typography color="text.secondary">
            Aveți dreptul să accesați, corectați sau ștergeți datele personale dumneavoastră în orice moment prin setările contului dumneavoastră. De asemenea, puteți contacta-ne pentru a exercita aceste drepturi.
          </Typography>

          <Typography variant="h4">6. Contactați-ne</Typography>
          <Typography color="text.secondary">
            Dacă aveți întrebări cu privire la această politică de confidențialitate, vă rugăm să contactați-ne prin sistemul de mesajare de pe platformă.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
