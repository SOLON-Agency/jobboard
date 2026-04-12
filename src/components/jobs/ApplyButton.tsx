"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
  type SxProps,
  type Theme,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { trackCompanyEngage } from "@/services/companies.service";
import { parseSupabaseError } from "@/lib/utils";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import type { Tables } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApplyButtonProps {
  job: Pick<
    Tables<"job_listings">,
    | "id"
    | "slug"
    | "title"
    | "application_url"
    | "application_form_id"
    | "company_id"
    | "location"
    | "job_type"
    | "salary_min"
    | "salary_max"
  >;
  company?: Pick<Tables<"companies">, "name" | "logo_url" | "slug"> | null;
  label?: string;
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  variant?: "contained" | "outlined";
  sx?: SxProps<Theme>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** True when the value looks like an email address rather than a URL. */
const isEmailAddress = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Builds the pre-filled email subject.
 * Format: "Candidatură + <companyName> | <jobTitle>"
 */
const buildMailtoSubject = (companyName: string | undefined, jobTitle: string): string => {
  const contact = companyName?.trim();
  return contact ? `Candidatură + ${contact} | ${jobTitle}` : `Candidatură | ${jobTitle}`;
};

const notifyApplication = (
  supabase: SupabaseClient,
  jobId: string
) => {
  void supabase.functions
    .invoke("send-email", {
      body: { event: "application_notification", job_id: jobId },
    })
    .catch((err: unknown) => console.warn("notify-application:", err));
};

/** Unique violation on `applications` (not form_responses). */
const isApplicationsDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const { code, message = "" } = err as { code?: string; message?: string };
  if (code !== "23505") return false;
  const m = message.toLowerCase();
  if (m.includes("form_response")) return false;
  return m.includes("application") || /job_id|user_id/.test(m);
};

// ─── ApplyButton ──────────────────────────────────────────────────────────────

export const ApplyButton: React.FC<ApplyButtonProps> = ({
  job,
  company,
  label = "Aplică",
  size = "medium",
  fullWidth = false,
  variant = "contained",
  sx,
}) => {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // ── External URL confirmation dialog state ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const commonSx = { borderRadius: 5, fontWeight: 700, ...sx };

  // ── Existing application check (prefetch) ────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setAlreadyApplied(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", job.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data) setAlreadyApplied(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, job.id, supabase]);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // ── No application method → link to job page ──────────────────────────────
  if (!job.application_url && !job.application_form_id) {
    return !isSmallScreen ? (
      <Button
        component={Link}
        href={`/jobs/${job.slug}`}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        endIcon={<AutoAwesomeIcon />}
        sx={commonSx}
      >
        {label}
      </Button>
    ) : null;
  }

  const isExternalUrl = !!job.application_url && !job.application_form_id;
  const isEmailApplication =
    isExternalUrl && isEmailAddress(job.application_url!);

  const mailtoHref = isEmailApplication
    ? `mailto:${job.application_url}?subject=${encodeURIComponent(
        buildMailtoSubject(company?.name, job.title),
      )}`
    : null;

  // ── External URL / email: confirmation dialog handlers ───────────────────
  const handleConfirmOpen = () => {
    setConfirmError(null);
    setConfirmed(false);
    setConfirmOpen(true);
  };

  const handleConfirmApply = async () => {
    if (!user) {
      setConfirmError("Trebuie să fii autentificat pentru a aplica.");
      return;
    }
    setConfirming(true);
    setConfirmError(null);
    try {
      const { error: appErr } = await supabase.from("applications").insert({
        job_id: job.id,
        user_id: user.id,
        form_data: null,
        status: "pending",
      });
      if (appErr) throw appErr;

      notifyApplication(supabase, job.id);
      trackCompanyEngage(supabase, job.company_id).catch(() => {});
      setAlreadyApplied(true);
      setConfirmed(true);

      if (mailtoHref) {
        window.open(mailtoHref, "_self");
      } else {
        window.open(job.application_url!, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      if (isApplicationsDuplicateError(err) || (err as { code?: string }).code === "23505") {
        setAlreadyApplied(true);
        setConfirmOpen(false);
        return;
      }
      setConfirmError(parseSupabaseError(err));
    } finally {
      setConfirming(false);
    }
  };

  // ── Shared icon-only sx overrides for mobile ──────────────────────────────
  const iconOnlySx = isSmallScreen
    ? {
        minWidth: 0,
        px: size === "small" ? 1 : size === "large" ? 1.5 : 1.25,
        "& .MuiButton-endIcon": { mx: 0 },
      }
    : {};

  if (alreadyApplied) {
    return (
      <Button
        disabled
        variant="outlined"
        color="success"
        size={size}
        fullWidth={fullWidth}
        endIcon={<TaskAltIcon />}
        aria-label={isSmallScreen ? "Aplicat" : undefined}
        sx={{ ...commonSx, ...iconOnlySx }}
      >
        {isSmallScreen ? null : "Aplicat"}
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={isExternalUrl ? handleConfirmOpen : () => setDrawerOpen(true)}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        endIcon={<AutoAwesomeIcon />}
        aria-label={isSmallScreen ? label : undefined}
        sx={{ ...commonSx, ...iconOnlySx }}
      >
        {isSmallScreen ? null : label}
      </Button>

      {/* ── External URL confirmation dialog ──────────────────────────────── */}
      <Dialog
        open={confirmOpen}
        onClose={() => !confirming && setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {confirmed ? "Aplicație înregistrată!" : `Aplică la ${job.title}`}
        </DialogTitle>

        <DialogContent>
          {confirmed ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 2, textAlign: "center" }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 52, color: "success.main" }} />
              <Typography color="text.secondary">
                {isEmailApplication
                  ? "Candidatura a fost înregistrată. Clientul tău de email s-a deschis cu subiectul pre-completat."
                  : "Candidatura a fost înregistrată. Link-ul s-a deschis într-o fereastră nouă."}
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {!user && (
                <Alert severity="info">
                  Trebuie să fii{" "}
                  <Link href="/login" style={{ color: "inherit", fontWeight: 700 }}>
                    autentificat
                  </Link>{" "}
                  pentru a aplica.
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary">
                {isEmailApplication
                  ? "Vei trimite un email direct angajatorului. Clientul tău de email se va deschide cu adresa și subiectul pre-completate:"
                  : "Vei fi redirecționat către site-ul extern al angajatorului pentru a finaliza aplicația:"}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  wordBreak: "break-all",
                }}
              >
                {isEmailApplication ? (
                  <EmailOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                ) : (
                  <OpenInNewIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: "monospace" }}
                >
                  {job.application_url}
                </Typography>
              </Box>
              {isEmailApplication && (
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: "action.hover",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 0.25 }}
                  >
                    Subiect pre-completat:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: "monospace", fontWeight: 600 }}
                  >
                    {buildMailtoSubject(company?.name, job.title)}
                  </Typography>
                </Box>
              )}
              {confirmError && <Alert severity="error">{confirmError}</Alert>}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {confirmed ? (
            <Button
              variant="outlined"
              onClick={() => setConfirmOpen(false)}
              sx={{ borderRadius: 5 }}
            >
              Închide
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={() => setConfirmOpen(false)}
                disabled={confirming}
                sx={{ borderRadius: 5 }}
              >
                Anulează
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirmApply}
                disabled={confirming || !user}
                endIcon={
                  confirming ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : isEmailApplication ? (
                    <EmailOutlinedIcon />
                  ) : (
                    <OpenInNewIcon />
                  )
                }
                sx={{ borderRadius: 5, fontWeight: 700 }}
              >
                {confirming
                  ? "Se înregistrează..."
                  : isEmailApplication
                    ? "Deschide email"
                    : "Continuă"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Form application drawer ───────────────────────────────────────── */}
      {!isExternalUrl && (
        <ApplicationForm
          job={job}
          company={company}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSubmitted={() => setAlreadyApplied(true)}
        />
      )}
    </>
  );
};
