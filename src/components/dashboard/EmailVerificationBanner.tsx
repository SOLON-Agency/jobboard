"use client";

import React, { useState } from "react";
import { Alert, Button, CircularProgress, Collapse } from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import { useAuth } from "@/hooks/useAuth";

export function EmailVerificationBanner() {
  const { user, resendVerification } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUnverified =
    user !== null && !user.email_confirmed_at && !user.confirmed_at;

  const handleResend = async () => {
    if (!user?.email) return;
    setSending(true);
    setError(null);
    const { error: resendErr } = await resendVerification(user.email);
    setSending(false);
    if (resendErr) {
      setError(resendErr.message);
    } else {
      setSent(true);
    }
  };

  return (
    <Collapse in={isUnverified} unmountOnExit>
      <Alert
        severity={sent ? "success" : "warning"}
        icon={sent ? <MarkEmailReadIcon fontSize="inherit" /> : undefined}
        sx={{ mb: 3, alignItems: "center" }}
        action={
          !sent ? (
            <Button
              color="inherit"
              size="small"
              disabled={sending}
              startIcon={
                sending ? <CircularProgress size={14} color="inherit" /> : null
              }
              onClick={handleResend}
            >
              {sending ? "Se trimite..." : "Retrimite email"}
            </Button>
          ) : null
        }
      >
        {sent
          ? "Email de verificare trimis! Verifică-ți căsuța de e-mail."
          : error
            ? `Eroare: ${error}`
            : "Adresa ta de e-mail nu este verificată. Verifică-ți căsuța de e-mail sau retrimite linkul de confirmare."}
      </Alert>
    </Collapse>
  );
};
