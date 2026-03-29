"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getUserAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} from "@/services/alerts.service";
import type { Tables } from "@/types/database";

export default function AlertsPage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [alerts, setAlerts] = useState<Tables<"alerts">[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [filterQ, setFilterQ] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    if (!user) return;
    const data = await getUserAlerts(supabase, user.id);
    setAlerts(data);
  }, [user, supabase]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleCreate = async () => {
    if (!user || !name) return;
    const filters: Record<string, string> = {};
    if (filterQ) filters.q = filterQ;
    if (filterLocation) filters.location = filterLocation;

    await createAlert(supabase, {
      user_id: user.id,
      name,
      filters,
      frequency,
    });
    setDialogOpen(false);
    setName("");
    setFilterQ("");
    setFilterLocation("");
    setMessage("Alert created.");
    await loadAlerts();
  };

  const handleToggle = async (alert: Tables<"alerts">) => {
    await updateAlert(supabase, alert.id, { is_active: !alert.is_active });
    await loadAlerts();
  };

  const handleDelete = async (id: string) => {
    await deleteAlert(supabase, id);
    await loadAlerts();
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h3">Job Alerts</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          New Alert
        </Button>
      </Stack>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      {alerts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
          <Typography color="text.secondary">
            No alerts set up yet. Create one to get notified about new jobs.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {alerts.map((alert) => (
            <Paper
              key={alert.id}
              sx={{ p: 2, border: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 2 }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={600}>
                  {alert.name}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip label={alert.frequency} size="small" variant="outlined" />
                  {Object.entries(alert.filters as Record<string, string>).map(([k, v]) => (
                    <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
              <FormControlLabel
                control={<Switch checked={alert.is_active} onChange={() => handleToggle(alert)} color="primary" />}
                label={alert.is_active ? "Active" : "Paused"}
              />
              <IconButton onClick={() => handleDelete(alert.id)} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Job Alert</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Alert Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Search Query" value={filterQ} onChange={(e) => setFilterQ(e.target.value)} fullWidth />
            <TextField label="Location" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select value={frequency} label="Frequency" onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")}>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!name}>
            Create Alert
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
