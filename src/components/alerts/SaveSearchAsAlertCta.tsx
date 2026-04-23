"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Tooltip } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import appSettings from "@/config/app.settings.json";
import { useAuth } from "@/hooks/useAuth";

const FILTER_KEYS = ["q", "location", "type", "experience", "salaryMin", "salaryMax", "remote", "minBenefits"];

interface SaveSearchAsAlertCtaProps {
  /** Variant — "button" (default) renders a full button; "inline" renders a smaller outlined one. */
  variant?: "button" | "inline";
}

export function SaveSearchAsAlertCta({ variant = "button" }: SaveSearchAsAlertCtaProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  if (!appSettings.features.alerts) return null;

  const activeFilters = FILTER_KEYS.filter((k) => searchParams.has(k));
  if (activeFilters.length === 0) return null;

  const handleClick = () => {
    if (!user) {
      router.push(`/login?redirect=/dashboard/alerts/new?${searchParams.toString()}`);
      return;
    }
    router.push(`/dashboard/alerts/new?${searchParams.toString()}`);
  };

  if (variant === "inline") {
    return (
      <Button
        size="small"
        variant="outlined"
        startIcon={<NotificationsActiveIcon />}
        onClick={handleClick}
        sx={{ minHeight: 44 }}
        aria-label="Creează alertă cu această căutare"
      >
        Creează alertă cu această căutare
      </Button>
    );
  }

  return (
    <Tooltip title="Primești un email când apar anunțuri care se potrivesc filtrelor tale.">
      <Button
        variant="contained"
        startIcon={<NotificationsActiveIcon />}
        onClick={handleClick}
        sx={{ mt: 2, minHeight: 44 }}
        aria-label="Creează alertă cu această căutare"
      >
        Creează alertă cu această căutare
      </Button>
    </Tooltip>
  );
}
