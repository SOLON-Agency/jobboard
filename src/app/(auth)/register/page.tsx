import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Box, CircularProgress, Container } from "@mui/material";
import appSettings from "@/config/app.settings.json";

export const metadata: Metadata = {
  title: "Înregistrare",
  description: `Creează-ți contul gratuit pe ${appSettings.name} și accesează mii de locuri de muncă juridice din România.`,
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
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
      <RegisterForm />
    </Suspense>
  );
}
