import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Container, CircularProgress, Box } from "@mui/material";
import appSettings from "@/config/app.settings.json";

export const metadata: Metadata = {
  title: "Conectare",
  description: `Conectează-te la contul tău ${appSettings.name} și accesează mii de locuri de muncă juridice din România.`,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
