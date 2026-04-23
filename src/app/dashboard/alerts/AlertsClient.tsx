"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArchiveIcon from "@mui/icons-material/Archive";
import EditIcon from "@mui/icons-material/Edit";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/contexts/ToastContext";
import {
  getUserAlerts,
  getAllAlerts,
  createAlert,
  updateAlert,
  archiveAlert,
  parseFilters,
  serializeFilters,
} from "@/services/alerts.service";
import { AlertFilterSummary } from "@/components/alerts/AlertFilterSummary";
import { CreateAlertDrawer } from "@/components/alerts/CreateAlertDrawer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import type { Tables } from "@/types/database";
import type { AlertFormData } from "@/components/forms/validations/alert.schema";
import appSettings from "@/config/app.settings.json";

type Alert = Tables<"alerts">;
type AlertWithProfile = Alert & { profiles?: { full_name: string | null; slug: string | null } | null };

const frequencyLabel: Record<string, string> = {
  instant: "Imediat",
  daily: "Zilnic",
  weekly: "Săptămânal",
};

function RowSkeleton() {
  return (
    <Stack spacing={1.5}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />
      ))}
    </Stack>
  );
}

export function AlertsClient() {
  if (!appSettings.features.alerts) {
    return (
      <Typography variant="body1" color="text.secondary">
        Funcționalitatea de alerte nu este activată.
      </Typography>
    );
  }
  return <AlertsContent />;
}

function AlertsContent() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const supabase = useSupabase();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<AlertWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = isAdmin
        ? await getAllAlerts(supabase)
        : await getUserAlerts(supabase, user.id, { archived: false });
      setAlerts(data as AlertWithProfile[]);
    } catch {
      showToast("Nu s-au putut încărca alertele.", "error", 5000);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, supabase, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingAlert(null);
    setDrawerOpen(true);
  };

  const openEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setDrawerOpen(true);
  };

  const handleSubmit = async (data: AlertFormData) => {
    if (!user) return;
    const { name, ...rest } = data;
    const filters = serializeFilters(rest);
    try {
      if (editingAlert) {
        await updateAlert(supabase, editingAlert.id, { name, filters });
        showToast("Alertă actualizată.");
      } else {
        await createAlert(supabase, { user_id: user.id, name, filters });
        showToast("Alertă creată cu succes.");
      }
      setDrawerOpen(false);
      await load();
    } catch {
      showToast("A apărut o eroare. Încearcă din nou.", "error", 5000);
    }
  };

  const handleToggleActive = async (alert: Alert) => {
    try {
      await updateAlert(supabase, alert.id, { is_active: !alert.is_active });
      showToast(
        alert.is_active ? "Alertă dezactivată." : "Alertă activată.",
        "info"
      );
      await load();
    } catch {
      showToast("Nu s-a putut modifica alerta.", "error", 5000);
    }
  };

  const handleArchive = async (alert: Alert) => {
    try {
      await archiveAlert(supabase, alert.id, true);
      showToast("Alertă arhivată.", "info");
      await load();
    } catch {
      showToast("Nu s-a putut arhiva alerta.", "error", 5000);
    }
  };

  const editingFilters = editingAlert ? parseFilters(editingAlert.filters) : undefined;

  return (
    <>
      <DashboardPageHeader
        title={<Typography variant="h3">Alerte</Typography>}
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Primești email când apar anunțuri noi care corespund căutărilor tale.
          </Typography>
        }
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ minHeight: 44 }}
          >
            Creează alertă
          </Button>
        }
      />

      {loading ? (
        <RowSkeleton />
      ) : alerts.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid rgba(3, 23, 12, 0.1)",
            borderRadius: 2,
          }}
        >
          <NotificationsIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Nicio alertă configurată
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Creează o alertă pentru a fi notificat când apar anunțuri noi care îți corespund.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ minHeight: 44 }}>
            Creează prima alertă
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              showOwner={isAdmin}
              onEdit={() => openEdit(alert)}
              onToggleActive={() => handleToggleActive(alert)}
              onArchive={() => handleArchive(alert)}
            />
          ))}
        </Stack>
      )}

      <CreateAlertDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
        defaultFilters={editingFilters}
        title={editingAlert ? "Editează alerta" : "Creează alertă"}
      />
    </>
  );
}

interface AlertRowProps {
  alert: AlertWithProfile;
  showOwner: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onArchive: () => void;
}

function AlertRow({ alert, showOwner, onEdit, onToggleActive, onArchive }: AlertRowProps) {
  const filters = parseFilters(alert.filters);

  return (
    <Paper
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3 },
        py: 2,
        border: "1px solid rgba(3, 23, 12, 0.1)",
        borderRadius: 2,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {alert.name}
          </Typography>
          <Chip
            label={frequencyLabel[alert.frequency] ?? alert.frequency}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: "0.65rem" }}
          />
          {!alert.is_active && (
            <Chip
              label="Dezactivată"
              size="small"
              color="default"
              sx={{ height: 20, fontSize: "0.65rem" }}
            />
          )}
        </Stack>

        <AlertFilterSummary filters={filters} sx={{ mt: 0.5 }} />

        {showOwner && alert.profiles && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            Proprietar: {alert.profiles.full_name ?? "—"}
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={0.5} flexShrink={0} alignSelf={{ xs: "flex-end", sm: "center" }}>
        <Tooltip title={alert.is_active ? "Dezactivează" : "Activează"}>
          <IconButton
            size="small"
            onClick={onToggleActive}
            aria-label={alert.is_active ? "Dezactivează alerta" : "Activează alerta"}
          >
            {alert.is_active ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Editează">
          <IconButton size="small" onClick={onEdit} aria-label="Editează alerta">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Arhivează">
          <IconButton size="small" onClick={onArchive} color="default" aria-label="Arhivează alerta">
            <ArchiveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}
