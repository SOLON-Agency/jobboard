"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import {
  getExperienceItems,
  createExperienceItem,
  updateExperienceItem,
  deleteExperienceItem,
  reorderExperienceItems,
  type ExperienceItem,
} from "@/services/experience.service";
import { parseSupabaseError, truncate } from "@/lib/utils";
import { experienceSchema, type ExperienceFormData } from "./validations/experience.schema";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AddEditExperienceProps {
  initialItems?: ExperienceItem[];
  loading?: boolean;
  onReload?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddEditExperience({
  initialItems,
  loading = false,
  onReload,
}: AddEditExperienceProps) {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [items, setItems] = useState<ExperienceItem[]>(initialItems ?? []);

  // Sync when the parent finishes loading and passes real data for the first time.
  useEffect(() => {
    setItems(initialItems ?? []);
  }, [initialItems]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: { is_current: false },
  });

  const isCurrent = watch("is_current");

  const reload = useCallback(async () => {
    if (!user) return;
    const data = await getExperienceItems(supabase, user.id);
    setItems(data);
    onReload?.();
  }, [user, supabase, onReload]);

  // ── Drawer helpers ────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingId(null);
    setMessage(null);
    reset({ title: "", company: "", description: "", is_current: false, start_year: "", end_year: "" });
    setDrawerOpen(true);
  };

  const openEdit = (item: ExperienceItem) => {
    setEditingId(item.id);
    setMessage(null);
    reset({
      title: item.title,
      company: item.company,
      description: item.description ?? "",
      is_current: item.is_current,
      start_year: item.start_year != null ? String(item.start_year) : "",
      end_year: item.end_year != null ? String(item.end_year) : "",
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setMessage(null);
    setEditingId(null);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const onSubmit = async (data: ExperienceFormData) => {
    if (!user) return;
    setMessage(null);
    const payload = {
      title: data.title,
      company: data.company,
      description: data.description || null,
      is_current: data.is_current,
      start_year: data.start_year ? parseInt(data.start_year) : null,
      end_year: data.is_current
        ? new Date().getFullYear()
        : data.end_year
          ? parseInt(data.end_year)
          : null,
    };

    try {
      if (editingId) {
        await updateExperienceItem(supabase, editingId, payload);
      } else {
        await createExperienceItem(supabase, { ...payload, user_id: user.id, sort_order: items.length });
      }
      await reload();
      setMessage({ type: "success", text: editingId ? "Actualizat cu succes." : "Adăugat cu succes." });
      setTimeout(closeDrawer, 800);
    } catch (err) {
      setMessage({ type: "error", text: parseSupabaseError(err) });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await deleteExperienceItem(supabase, id);
      const updated = items.filter((i) => i.id !== id);
      const reordered = updated.map((item, idx) => ({ ...item, sort_order: idx }));
      await reorderExperienceItems(
        supabase,
        reordered.map((i) => ({ id: i.id, sort_order: i.sort_order }))
      );
      setItems(reordered);
      setDeleteConfirmId(null);
    } catch (err) {
      setMessage({ type: "error", text: parseSupabaseError(err) });
    }
  };

  // ── Reorder ───────────────────────────────────────────────────────────────

  const move = async (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    const reordered = [...items];
    [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
    const withOrder = reordered.map((item, i) => ({ ...item, sort_order: i }));
    setItems(withOrder);
    await reorderExperienceItems(
      supabase,
      withOrder.map((i) => ({ id: i.id, sort_order: i.sort_order }))
    );
  };

  // ── Sorted for display: current items first ───────────────────────────────

  const sortedItems = [...items].sort(
    (a, b) => Number(b.is_current) - Number(a.is_current) || a.sort_order - b.sort_order
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WorkOutlineIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Experiență profesională
            </Typography>
          </Stack>
          <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={openAdd}>
            Adaugă
          </Button>
        </Stack>

        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={72} />
            ))}
          </Stack>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
            Nu ai adăugat nicio experiență profesională.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {sortedItems.map((item, idx) => (
              <Paper key={item.id} variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2 }}>
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="flex-start" flexWrap="wrap" gap={0.75} sx={{ mb: 0.25 }}>
                      <Typography variant="subtitle2" fontWeight={700}
                        sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                        {truncate(item.title)}
                      </Typography>
                      {item.is_current && (
                        <Chip
                          label="Prezent"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, flexShrink: 0, mt: "2px" }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary"
                      sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                      {truncate(item.company, 80)}
                      {(item.start_year || item.end_year) && (
                        <>
                          {" "}
                          &middot; {item.start_year ?? "?"} —{" "}
                          {item.is_current ? "prezent" : (item.end_year ?? "prezent")}
                        </>
                      )}
                    </Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.disabled"
                        sx={{ mt: 0.25, display: "block", wordBreak: "break-word", overflowWrap: "break-word" }}>
                        {truncate(item.description)}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                    <Tooltip title="Mută sus">
                      <span>
                        <IconButton size="small" onClick={() => move(idx, -1)} disabled={idx === 0}
                          aria-label="Mută sus">
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Mută jos">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => move(idx, 1)}
                          disabled={idx === sortedItems.length - 1}
                          aria-label="Mută jos"
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Editează">
                      <IconButton size="small" onClick={() => openEdit(item)} aria-label="Editează">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {deleteConfirmId === item.id ? (
                      <>
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          sx={{ ml: 0.5, fontSize: "0.7rem", px: 1, minWidth: 0 }}
                          onClick={() => handleDelete(item.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", px: 1, minWidth: 0 }}
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Anulează
                        </Button>
                      </>
                    ) : (
                      <Tooltip title="Șterge">
                        <IconButton
                          size="small"
                          sx={{ color: "error.main" }}
                          onClick={() => setDeleteConfirmId(item.id)}
                          aria-label="Șterge experiență"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <EditSideDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingId ? "Editează experiență" : "Adaugă experiență"}
        message={message}
        onMessageClose={() => setMessage(null)}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label={editingId ? "Formular editare experiență" : "Formular adăugare experiență"}
        >
          <Stack spacing={2.5}>
            <TextField
              {...register("title")}
              label="Titlu / Funcție"
              placeholder="ex. Consilier juridic senior"
              fullWidth
              required
              error={!!errors.title}
              helperText={errors.title?.message}
              inputProps={{ "aria-describedby": errors.title ? "title-error" : undefined }}
            />

            <TextField
              {...register("company")}
              label="Companie / Angajator"
              placeholder="ex. Cabinet de Avocatură Popescu"
              fullWidth
              required
              error={!!errors.company}
              helperText={errors.company?.message}
              inputProps={{ "aria-describedby": errors.company ? "company-error" : undefined }}
            />

            <Controller
              name="is_current"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        if (e.target.checked) {
                          setValue("end_year", String(new Date().getFullYear()));
                        }
                      }}
                      size="small"
                    />
                  }
                  label="Lucrez aici în prezent"
                />
              )}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                {...register("start_year")}
                label="An început"
                placeholder="2018"
                fullWidth
                inputProps={{ maxLength: 4, inputMode: "numeric", "aria-describedby": errors.start_year ? "start-year-error" : undefined }}
                error={!!errors.start_year}
                helperText={errors.start_year?.message}
              />
              <Box sx={{ flex: 1 }}>
                <TextField
                  {...register("end_year")}
                  label="An finalizare"
                  placeholder="2022"
                  fullWidth
                  inputProps={{ maxLength: 4, inputMode: "numeric", "aria-describedby": errors.end_year ? "end-year-error" : undefined }}
                  disabled={isCurrent}
                  error={!!errors.end_year}
                  helperText={
                    isCurrent
                      ? "Setat automat la anul curent"
                      : errors.end_year?.message
                  }
                  required={!isCurrent}
                />
                {!isCurrent && !errors.end_year && (
                  <FormHelperText>Obligatoriu dacă nu lucrezi în prezent</FormHelperText>
                )}
              </Box>
            </Stack>

            <TextField
              {...register("description")}
              label="Descriere (opțional)"
              placeholder="Responsabilități, realizări, tehnologii folosite..."
              fullWidth
              multiline
              rows={4}
              error={!!errors.description}
              helperText={errors.description?.message}
            />

            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ px: 4 }}>
                {isSubmitting ? "Se salvează..." : "Salvează"}
              </Button>
              <Button variant="outlined" onClick={closeDrawer}>
                Anulează
              </Button>
            </Stack>
          </Stack>
        </Box>
      </EditSideDrawer>
    </>
  );
};
