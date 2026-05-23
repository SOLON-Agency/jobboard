"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import type { Tables } from "@/types/database";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { AddEditFaq } from "@/components/forms/AddEditFaq";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/contexts/ToastContext";
import {
  createFaqRow,
  deleteFaqRow,
  listFaqsForAdmin,
  type FaqPageTab,
  updateFaqRow,
} from "@/services/faq.service";
import type { FaqFormData } from "@/components/forms/validations/faq.schema";

function faqPlacementAdminLabel(p: string): string {
  if (p === "both") return "Ambele pagini";
  if (p === "how_it_works") return "Cum funcționează";
  return "Pagina principală";
}

export function AdminFaqClient() {
  const supabase = useSupabase();
  const { showToast } = useToast();
  const [tab, setTab] = useState<FaqPageTab>("home");
  const [rows, setRows] = useState<Tables<"faq">[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"faq"> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFaqsForAdmin(supabase, tab);
      setRows(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Eroare la încărcare";
      showToast(msg, "error", 5000);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, tab, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleActive = async (row: Tables<"faq">) => {
    try {
      await updateFaqRow(supabase, row.id, { is_active: !row.is_active });
      showToast(row.is_active ? "Întrebare dezactivată." : "Întrebare activată.", "info");
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Eroare la actualizare";
      showToast(msg, "error", 5000);
    }
  };

  const handleDelete = async (row: Tables<"faq">) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Ștergi definitiv această întrebare?\n\n„${row.question.slice(0, 80)}…”`)
    ) {
      return;
    }
    try {
      await deleteFaqRow(supabase, row.id);
      showToast("Întrebarea a fost ștearsă.", "success");
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Eroare la ștergere";
      showToast(msg, "error", 5000);
    }
  };

  const handleFormSubmit = async (data: FaqFormData) => {
    try {
      if (editing) {
        await updateFaqRow(supabase, editing.id, {
          placement: data.placement,
          question: data.question,
          answer: data.answer,
          sort_order: data.sort_order,
          is_active: data.is_active,
        });
        showToast("Întrebarea a fost actualizată.", "success");
      } else {
        await createFaqRow(supabase, {
          placement: data.placement,
          question: data.question,
          answer: data.answer,
          sort_order: data.sort_order,
          is_active: data.is_active,
        });
        showToast("Întrebarea a fost adăugată.", "success");
      }
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Eroare la salvare";
      showToast(msg, "error", 5000);
      throw e;
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (row: Tables<"faq">) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const tabIndex = tab === "home" ? 0 : 1;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
      <DashboardPageHeader
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <HelpOutlineIcon color="primary" aria-hidden />
            <Typography variant="h3">Întrebări frecvente</Typography>
          </Stack>
        }
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Gestionează cuprinsul FAQ pentru pagina principală și pentru „Cum funcționează”.
            Întrebările marcate „Ambele pagini” apar în ambele tab-uri și pe ambele pagini publice.
            Modificările apar pe site după revalidarea paginilor (până la 24 h în producție).
          </Typography>
        }
      />
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v: number) => {
            setTab(v === 0 ? "home" : "how_it_works");
          }}
          aria-label="Pagină FAQ"
          sx={{ borderBottom: 1, borderColor: "divider", px: 1 }}
        >
          <Tab label="Pagina principală" id="faq-tab-home" aria-controls="faq-panel" />
          <Tab label="Cum funcționează" id="faq-tab-hiw" aria-controls="faq-panel" />
        </Tabs>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
          Adaugă întrebare
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress aria-label="Se încarcă" />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small" aria-labelledby="faq-table-caption">
            <caption id="faq-table-caption" style={{ captionSide: "top", textAlign: "left", padding: "12px 16px" }}>
              Lista întrebărilor ({rows.length})
            </caption>
            <TableHead>
              <TableRow>
                <TableCell width={72}>Ordine</TableCell>
                <TableCell width={140}>Pagină</TableCell>
                <TableCell>Întrebare</TableCell>
                <TableCell width={120} align="center">
                  Activă
                </TableCell>
                <TableCell width={120} align="right">
                  Acțiuni
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.sort_order}</TableCell>
                  <TableCell>
                    <Chip
                      label={faqPlacementAdminLabel(row.placement)}
                      size="small"
                      variant="outlined"
                      color={row.placement === "both" ? "primary" : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {row.question}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      {row.answer.slice(0, 120)}
                      {row.answer.length > 120 ? "…" : ""}
                    </Typography>
                    {!row.is_active ? (
                      <Chip label="Inactivă" size="small" color="warning" sx={{ mt: 1 }} />
                    ) : null}
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={row.is_active}
                      onChange={() => void handleToggleActive(row)}
                      inputProps={{ "aria-label": `Activă: ${row.question.slice(0, 40)}` }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label="Editează"
                      onClick={() => openEdit(row)}
                      size="small"
                      color="primary"
                    >
                      <EditOutlinedIcon />
                    </IconButton>
                    <IconButton
                      aria-label="Șterge"
                      onClick={() => void handleDelete(row)}
                      size="small"
                      color="error"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Nu există întrebări pentru această pagină. Apasă „Adaugă întrebare”.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AddEditFaq
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        editing={editing}
        defaultPlacement={tab}
        onSubmit={handleFormSubmit}
      />
    </Box>
  );
}
