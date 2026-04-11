"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import { useAuth } from "@/hooks/useAuth";

const VerifyEmailContent: React.FC = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { resendVerification } = useAuth();

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setSending(true);
    setError(null);
    const { error: resendErr } = await resendVerification(email);
    setSending(false);
    if (resendErr) {
      setError(resendErr.message);
    } else {
      setSent(true);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 }, minHeight: "calc(100vh - 200px)" }}>
      {/* Primary alert */}
      {sent ? (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} role="status">
          <AlertTitle sx={{ fontWeight: 700 }}>E-mail retrimis</AlertTitle>
          Am trimis un nou link de confirmare la{" "}
          <Box component="strong" sx={{ wordBreak: "break-all" }}>
            {email}
          </Box>
          . Verifică-ți căsuța de intrare și dosarul Spam.
        </Alert>
      ) : (
        <Alert
          severity="warning"
          icon={<MarkEmailReadIcon fontSize="inherit" />}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>
            Confirmă adresa de e-mail
          </AlertTitle>
          Contul asociat cu{" "}
          {email ? (
            <Box
              component="strong"
              sx={{ wordBreak: "break-all" }}
              aria-label={`Adresa de e-mail: ${email}`}
            >
              {email}
            </Box>
          ) : (
            "adresa ta de e-mail"
          )}{" "}
          nu a fost confirmat încă. Verifică-ți căsuța de intrare și apasă pe
          link-ul de confirmare primit, sau solicită un link nou mai jos.
        </Alert>
      )}

      {/* Error feedback */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} role="alert">
          {error}
        </Alert>
      )}

      {/* Resend button */}
      {!sent && (
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={sending || !email}
          startIcon={
            sending ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <MarkEmailReadIcon />
            )
          }
          onClick={handleResend}
          aria-label="Retrimite e-mailul de confirmare"
          sx={{ mb: 1.5, py: 1.5 }}
        >
          {sending ? "Se trimite..." : "Retrimite e-mailul de confirmare"}
        </Button>
      )}

      {/* Back to login */}
      <Button
        component={Link}
        href="/login"
        variant="outlined"
        fullWidth
        size="large"
        sx={{ py: 1.5 }}
      >
        Înapoi la conectare
      </Button>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        align="center"
        sx={{ mt: 2 }}
      >
        Link-ul de confirmare expiră după 24 de ore.
      </Typography>
    </Container>
  );
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "80vh",
          }}
        >
          <CircularProgress aria-label="Se încarcă..." />
        </Box>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
