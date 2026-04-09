"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useAuth } from "@/hooks/useAuth";
import appSettings from "@/config/app.settings.json";

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
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper
        sx={{
          p: { xs: 3, sm: 5 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            bgcolor: sent ? "success.main" : "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            transition: "background-color 0.3s",
          }}
          aria-hidden="true"
        >
          {sent ? (
            <CheckCircleIcon sx={{ fontSize: 36, color: "#fff" }} />
          ) : (
            <MarkEmailReadIcon sx={{ fontSize: 36, color: "#fff" }} />
          )}
        </Box>

        <Typography variant="h3" sx={{ mb: 1.5 }}>
          Confirmă adresa de e-mail
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Trebuie să îți confirmi adresa de e-mail înainte de a te putea conecta.
        </Typography>

        {email && (
          <Typography
            component="p"
            sx={{
              display: "inline-block",
              px: 2,
              py: 0.75,
              mb: 3,
              borderRadius: 1.5,
              bgcolor: "action.hover",
              fontWeight: 700,
              fontSize: "0.95rem",
              wordBreak: "break-all",
            }}
            aria-label={`Adresa de e-mail: ${email}`}
          >
            {email}
          </Typography>
        )}

        {sent ? (
          <Typography
            color="success.main"
            fontWeight={600}
            sx={{ mb: 3 }}
            role="status"
          >
            E-mailul de confirmare a fost retrimis. Verifică-ți căsuța de intrare.
          </Typography>
        ) : (
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Am trimis un link de confirmare la adresa de mai sus. Dacă nu l-ai
            primit, poți solicita unul nou.
          </Typography>
        )}

        {error && (
          <Typography
            color="error"
            variant="body2"
            role="alert"
            sx={{ mb: 2 }}
          >
            {error}
          </Typography>
        )}

        {!sent && (
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={sending || !email}
            startIcon={
              sending ? <CircularProgress size={18} color="inherit" /> : null
            }
            onClick={handleResend}
            sx={{ mb: 2, py: 1.5 }}
          >
            {sending ? "Se trimite..." : "Retrimite e-mailul de confirmare"}
          </Button>
        )}

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
          sx={{ mt: 3 }}
        >
          Verifică și dosarul Spam dacă nu găsești e-mailul în căsuța principală.
          Link-ul de confirmare expiră după 24 de ore.
        </Typography>
      </Paper>
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
            minHeight: "60vh",
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
