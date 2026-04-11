"use client";

import React, { useTransition } from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import WorkIcon from "@mui/icons-material/Work";
import appSettings from "@/config/app.settings.json";
import { approve, deny } from "./actions";

// ── Scope metadata ──────────────────────────────────────────────────────────

interface ScopeInfo {
  label: string;
  description: string;
  icon: React.ReactNode;
}

const SCOPE_REGISTRY: Record<string, ScopeInfo> = {
  openid: {
    label: "Identitate",
    description: "Verifică-ți identitatea cu contul tău",
    icon: <SecurityIcon fontSize="small" />,
  },
  profile: {
    label: "Profil",
    description: "Accesează numele, avatarul și detaliile profilului tău public",
    icon: <PersonIcon fontSize="small" />,
  },
  email: {
    label: "Adresă de e-mail",
    description: "Citește adresa ta de e-mail",
    icon: <EmailIcon fontSize="small" />,
  },
  "jobs:read": {
    label: "Locuri de muncă (citire)",
    description: "Vizualizează listele de joburi și aplicațiile tale",
    icon: <WorkIcon fontSize="small" />,
  },
  "jobs:write": {
    label: "Locuri de muncă (scriere)",
    description: "Aplică la joburi și gestionează aplicațiile în numele tău",
    icon: <BusinessCenterIcon fontSize="small" />,
  },
  "profile:write": {
    label: "Profil (scriere)",
    description: "Actualizează datele profilului tău",
    icon: <BadgeIcon fontSize="small" />,
  },
  "account:read": {
    label: "Cont",
    description: "Accesează informațiile contului tău",
    icon: <AccountCircleIcon fontSize="small" />,
  },
};

const resolveScope = (scope: string): ScopeInfo =>
  SCOPE_REGISTRY[scope] ?? {
    label: scope,
    description: `Acces la resursa: ${scope}`,
    icon: <LockIcon fontSize="small" />,
  };

// ── Props ────────────────────────────────────────────────────────────────────

interface ConsentScreenProps {
  userEmail: string;
  clientId: string;
  clientName: string;
  clientLogo?: string;
  redirectUri: string;
  scopes: string[];
  state: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export const ConsentScreen: React.FC<ConsentScreenProps> = ({
  userEmail,
  clientId,
  clientName,
  clientLogo,
  redirectUri,
  scopes,
  state,
}) => {
  const [approvePending, startApprove] = useTransition();
  const [denyPending, startDeny] = useTransition();
  const pending = approvePending || denyPending;

  const resolvedScopes = scopes.map(resolveScope);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        {/* ── Logos ─────────────────────────────────────────────── */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{ mb: 3 }}
          aria-hidden="true"
        >
          {/* App logo placeholder */}
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                color: "primary.contrastText",
                fontWeight: 800,
                fontSize: "1.1rem",
                letterSpacing: "-0.03em",
              }}
            >
              {appSettings.name[0]}
            </Typography>
          </Box>

          {/* Connector dots */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: i === 1 ? "primary.main" : "divider",
                }}
              />
            ))}
          </Stack>

          {/* Third-party app logo */}
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {clientLogo ? (
              <Image
                src={clientLogo}
                alt={`${clientName} logo`}
                width={44}
                height={44}
                style={{ objectFit: "contain" }}
              />
            ) : (
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  color: "text.secondary",
                  letterSpacing: "-0.03em",
                }}
              >
                {clientName[0]?.toUpperCase() ?? "?"}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* ── Heading ───────────────────────────────────────────── */}
        <Typography variant="h3" align="center" sx={{ mb: 0.75 }}>
          {clientName} solicită acces
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          la contul tău{" "}
          <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
            {appSettings.name}
          </Box>
        </Typography>

        {/* ── Signed-in user pill ────────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.25,
            mb: 3,
            borderRadius: 2,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
          aria-label={`Conectat ca ${userEmail}`}
        >
          <AccountCircleIcon fontSize="small" sx={{ color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            Conectat ca
          </Typography>
          <Chip
            label={userEmail}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, maxWidth: 220 }}
          />
        </Box>

        {/* ── Permissions list ───────────────────────────────────── */}
        {resolvedScopes.length > 0 && (
          <>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: "block", mb: 1.5, letterSpacing: "0.08em" }}
            >
              Permisiuni solicitate
            </Typography>

            <Stack spacing={1.5} component="ul" sx={{ pl: 0, listStyle: "none", mb: 3 }}>
              {resolvedScopes.map((s, i) => (
                <Box
                  key={i}
                  component="li"
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      mt: 0.25,
                      color: "primary.main",
                      flexShrink: 0,
                    }}
                  >
                    {s.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {s.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* ── Actions ───────────────────────────────────────────── */}
        <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5}>
          {/* Deny */}
          <form action={deny} style={{ flex: 1 }}>
            <input type="hidden" name="redirect_uri" value={redirectUri} />
            <input type="hidden" name="state" value={state} />
            <Button
              type="submit"
              variant="outlined"
              fullWidth
              size="large"
              disabled={pending}
              startIcon={
                denyPending ? <CircularProgress size={16} color="inherit" /> : null
              }
              aria-label="Refuză accesul"
              sx={{ py: 1.4 }}
            >
              Refuză
            </Button>
          </form>

          {/* Approve */}
          <form action={approve} style={{ flex: 1 }}>
            <input type="hidden" name="redirect_uri" value={redirectUri} />
            <input type="hidden" name="state" value={state} />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={pending}
              startIcon={
                approvePending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
              aria-label={`Permite accesul pentru ${clientName}`}
              sx={{ py: 1.4 }}
            >
              Permite accesul
            </Button>
          </form>
        </Stack>

        {/* ── Footer note ───────────────────────────────────────── */}
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          align="center"
          sx={{ mt: 3, lineHeight: 1.6 }}
        >
          Prin apăsarea{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            Permite accesul
          </Box>
          , autorizezi{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            {clientName}
          </Box>{" "}
          să acceseze contul tău conform permisiunilor de mai sus. Poți revoca
          accesul oricând din setările contului.
        </Typography>

        {/* Debug info visible only in dev */}
        {process.env.NODE_ENV === "development" && (
          <Box
            sx={{
              mt: 3,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: "action.hover",
              fontFamily: "monospace",
              fontSize: "0.7rem",
              color: "text.secondary",
              wordBreak: "break-all",
            }}
            aria-hidden="true"
          >
            <strong>client_id:</strong> {clientId}
            <br />
            <strong>redirect_uri:</strong> {redirectUri}
            <br />
            <strong>scopes:</strong> {scopes.join(", ") || "(none)"}
          </Box>
        )}
      </Paper>
    </Container>
  );
};
