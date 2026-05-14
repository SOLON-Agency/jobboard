"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { claimCompanyAction } from "./actions";
import { useToast } from "@/contexts/ToastContext";

interface ClaimClientProps {
  token: string | null;
  code: string | null;
  /** Pre-filled from ?email= query param — used for unauthenticated re-entry */
  email: string | null;
  isAuthenticated: boolean;
}

export function ClaimClient({ token, code: initialCode, email, isAuthenticated }: ClaimClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [codeInput, setCodeInput] = useState(initialCode ?? "");
  // Start in submitting state when the magic link already supplies both token + code
  // and the user is authenticated — the auto-claim fires immediately on mount.
  const [isSubmitting, setIsSubmitting] = useState(
    !!(token && initialCode && isAuthenticated)
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClaimResult = useCallback(
    (result: Awaited<ReturnType<typeof claimCompanyAction>>) => {
      setIsSubmitting(false);
      if (!result.ok) {
        if (result.redirectTo) {
          router.push(result.redirectTo);
          return;
        }
        setError(result.error);
        return;
      }
      setSuccess(true);
      showToast("Felicitări! Compania a fost revendicată cu succes.", "success", 6000);
      setTimeout(() => {
        router.push("/dashboard/company");
      }, 2000);
    },
    [router, showToast]
  );

  const doClaimAttempt = useCallback(
    async (codeToUse: string) => {
      if (!token) {
        setIsSubmitting(false);
        setError("Link invalid — tokenul lipsește. Introduceți codul manual.");
        return;
      }
      setIsSubmitting(true);
      setError(null);
      const result = await claimCompanyAction({
        token,
        code: codeToUse,
        companyEmail: email ?? undefined,
      });
      handleClaimResult(result);
    },
    [token, email, handleClaimResult]
  );

  // Auto-claim: only on mount when magic link is complete and user is authenticated.
  // isSubmitting is already `true` from useState initializer in this case, so no
  // synchronous setState happens inside the effect body — satisfies the lint rule.
  const autoClaimAttempted = React.useRef(false);
  useEffect(() => {
    if (autoClaimAttempted.current) return;
    if (token && initialCode && isAuthenticated) {
      autoClaimAttempted.current = true;
      void claimCompanyAction({ token, code: initialCode, companyEmail: email ?? undefined })
        .then(handleClaimResult);
    }
    // Intentionally run once on mount — deps are effectively stable initial values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = codeInput.trim();
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setError("Codul trebuie să conțină exact 6 cifre.");
      return;
    }
    void doClaimAttempt(trimmed);
  };

  // ── Success state ────────────────────────────────────────────────────────────

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56 }} />
            <Typography variant="h5" fontWeight={700}>
              Companie revendicată!
            </Typography>
            <Typography color="text.secondary">
              Ești redirecționat către panoul de control...
            </Typography>
            <CircularProgress size={24} />
          </Stack>
        </Paper>
      </Container>
    );
  }

  // ── Auto-claiming in progress ────────────────────────────────────────────────

  if (token && initialCode && isAuthenticated && !error && !success && isSubmitting) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography color="text.secondary">
              Se verifică codul de revendicare...
            </Typography>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <LockOpenOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h5" fontWeight={700} component="h1">
                Revendică compania
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Preia gratuit controlul asupra profilului companiei tale.
              </Typography>
            </Box>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!isAuthenticated && (
            <Alert severity="info">
              Trebuie să ai un cont pentru a revendica compania.{" "}
              <Button
                size="small"
                variant="text"
                href={`/register${email ? `?email=${encodeURIComponent(email)}` : ""}${
                  token
                    ? `${email ? "&" : "?"}redirect=${encodeURIComponent(
                        `/claim?token=${token}`,
                      )}`
                    : ""
                }`}
                sx={{ fontWeight: 600, p: 0, minWidth: 0 }}
              >
                Creează cont
              </Button>{" "}
              sau{" "}
              <Button
                size="small"
                variant="text"
                href={`/login${
                  token
                    ? `?redirect=${encodeURIComponent(`/claim?token=${token}`)}`
                    : ""
                }`}
                sx={{ fontWeight: 600, p: 0, minWidth: 0 }}
              >
                conectează-te
              </Button>
              .
            </Alert>
          )}

          <Divider />

          <Box component="form" onSubmit={handleManualSubmit} noValidate>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Introduceți codul de 6 cifre din emailul de invitație:
              </Typography>
              <TextField
                label="Cod de revendicare"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputProps={{
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  maxLength: 6,
                  "aria-label": "Cod de revendicare în 6 cifre",
                  "aria-describedby": "claim-code-hint",
                  autoComplete: "one-time-code",
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOpenOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                placeholder="123456"
                fullWidth
                required
                disabled={isSubmitting || !isAuthenticated}
              />
              <Typography
                id="claim-code-hint"
                variant="caption"
                color="text.secondary"
              >
                Codul se află în emailul primit de la LegalJobs. Procesul
                durează ~60 de secunde, contul este gratuit, fără card.
              </Typography>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting || !isAuthenticated || codeInput.length !== 6}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <LockOpenOutlinedIcon />
                  )
                }
                sx={{ py: 1.5 }}
              >
                {isSubmitting ? "Se verifică..." : "Revendică compania"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
