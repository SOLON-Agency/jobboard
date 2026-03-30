"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserCompanies } from "@/services/companies.service";
import {
  getUserForms,
  createForm,
  updateForm,
  deleteForm,
  getFormWithFields,
} from "@/services/forms.service";
import { parseSupabaseError, formatDate } from "@/lib/utils";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import {
  AddEditForm,
  type FormData as FormFormData,
  type FormField,
} from "@/components/dashboard/AddEditForm";
import type { Tables } from "@/types/database";
import type { FormWithFields } from "@/services/forms.service";

type FormWithCount = Tables<"forms"> & { response_count: number };
type CompanyOption = { id: string; name: string };

const statusColor: Record<string, "default" | "success" | "warning"> = {
  draft: "warning",
  published: "success",
};

const fieldTypesToDb = (fields: FormField[]) =>
  fields.map((f) => ({
    field_type: f.field_type,
    label: f.label,
    placeholder: f.placeholder || null,
    is_required: f.is_required,
    sort_order: f.sort_order,
    options: f.options_raw
      ? f.options_raw.split(",").map((o) => o.trim()).filter(Boolean)
      : null,
  }));

const dbFieldsToFormFields = (dbFields: Tables<"form_fields">[]): FormField[] =>
  dbFields.map((f) => ({
    id: f.id,
    field_type: f.field_type as FormField["field_type"],
    label: f.label,
    placeholder: f.placeholder ?? "",
    is_required: f.is_required,
    options_raw: Array.isArray(f.options) ? (f.options as string[]).join(", ") : "",
    sort_order: f.sort_order,
  }));

export default function FormsPage() {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [forms, setForms] = useState<FormWithCount[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<FormWithFields | null>(null);
  const [formDefaults, setFormDefaults] = useState<FormFormData | null>(null);
  const [fieldDefaults, setFieldDefaults] = useState<FormField[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [formsData, companiesData] = await Promise.all([
      getUserForms(supabase, user.id),
      getUserCompanies(supabase, user.id),
    ]);
    setForms(formsData);
    setCompanies(
      companiesData.flatMap((cu) =>
        cu.companies ? [{ id: cu.companies.id, name: cu.companies.name }] : []
      )
    );
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingForm(null);
    setMessage(null);
    setFormDefaults({ name: "", description: "", company_id: companies[0]?.id ?? "" });
    setFieldDefaults([]);
    setDrawerOpen(true);
  };

  const openEdit = async (form: FormWithCount) => {
    setMessage(null);
    const full = await getFormWithFields(supabase, form.id);
    setEditingForm(full);
    setFormDefaults({ name: full.name, description: full.description ?? "", company_id: full.company_id });
    setFieldDefaults(dbFieldsToFormFields(full.form_fields));
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setMessage(null);
    setEditingForm(null);
  };

  const onSubmit = useCallback(
    async (data: FormFormData, fields: FormField[], status: "draft" | "published") => {
      setMessage(null);
      try {
        const dbFields = fieldTypesToDb(fields);
        if (editingForm) {
          await updateForm(supabase, editingForm.id, { name: data.name, description: data.description || null, status }, dbFields);
          setMessage({ type: "success", text: "Formularul a fost actualizat." });
        } else {
          await createForm(
            supabase,
            { name: data.name, description: data.description || null, company_id: data.company_id, status },
            dbFields
          );
          setMessage({ type: "success", text: status === "published" ? "Formularul a fost publicat." : "Formularul a fost salvat ca ciornă." });
        }
        await load();
        setTimeout(closeDrawer, 800);
      } catch (err) {
        setMessage({ type: "error", text: parseSupabaseError(err) });
      }
    },
    [supabase, editingForm, load]
  );

  const handleDelete = async (form: FormWithCount) => {
    if (!confirm(`Ștergi formularul „${form.name}"? Toate răspunsurile vor fi pierdute.`)) return;
    try {
      await deleteForm(supabase, form.id);
      await load();
    } catch (err) {
      setMessage({ type: "error", text: parseSupabaseError(err) });
    }
  };

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Formularele mele</Typography>
          <Typography variant="body2" color="text.secondary">
            Creează formulare de aplicare și urmărește răspunsurile.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={companies.length === 0}>
          Formular nou
        </Button>
      </Stack>

      {/* ── No companies warning ────────────────────────────────────────────── */}
      {!loading && companies.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
          <ArticleOutlinedIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h6" sx={{ mb: 0.5 }}>Nicio companie</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Trebuie să ai o companie înainte de a crea formulare.
          </Typography>
          <Button component={Link} href="/dashboard/company" variant="outlined">
            Adaugă o companie
          </Button>
        </Paper>
      )}

      {/* ── Loading skeletons ───────────────────────────────────────────────── */}
      {loading && (
        <Stack spacing={1.5}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!loading && companies.length > 0 && forms.length === 0 && (
        <Paper sx={{ p: 6, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <ArticleOutlinedIcon sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
          <Typography variant="h6" sx={{ mb: 0.5 }}>Niciun formular creat</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Creează primul formular de aplicare și leagă-l de un anunț de muncă.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Creează primul formular
          </Button>
        </Paper>
      )}

      {/* ── Forms list ──────────────────────────────────────────────────────── */}
      {!loading && forms.length > 0 && (
        <Stack spacing={1.5}>
          {forms.map((form) => (
            <Paper
              key={form.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 3,
                py: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                transition: "border-color 0.2s",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <ArticleOutlinedIcon sx={{ color: "text.secondary", flexShrink: 0 }} />

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {form.name}
                  </Typography>
                  <Chip
                    label={form.status}
                    size="small"
                    color={statusColor[form.status] ?? "default"}
                    sx={{ height: 20, fontSize: "0.68rem" }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {form.response_count} {form.response_count === 1 ? "răspuns" : "răspunsuri"} • creat {formatDate(form.created_at)}
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                <Tooltip title="Răspunsuri">
                  <IconButton
                    size="small"
                    component={Link}
                    href={`/dashboard/forms/${form.id}/responses`}
                  >
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editează">
                  <IconButton size="small" onClick={() => openEdit(form)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Șterge">
                  <IconButton size="small" color="error" onClick={() => handleDelete(form)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* ── Side drawer ─────────────────────────────────────────────────────── */}
      <EditSideDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingForm ? `Editează: ${editingForm.name}` : "Formular nou"}
        message={message}
        onMessageClose={() => setMessage(null)}
        width={560}
      >
        {formDefaults && (
          <AddEditForm
            key={editingForm?.id ?? "create"}
            companies={companies}
            editingForm={editingForm}
            defaultValues={formDefaults}
            defaultFields={fieldDefaults}
            onSubmit={onSubmit}
            onDelete={editingForm ? () => { handleDelete(editingForm as unknown as FormWithCount); closeDrawer(); } : undefined}
            onCancel={closeDrawer}
          />
        )}
      </EditSideDrawer>
    </>
  );
}
