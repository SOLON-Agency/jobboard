"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuItem as MuiMenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  type SelectChangeEvent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ArchiveIcon from "@mui/icons-material/Archive";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import appSettings from "@/config/app.settings.json";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/contexts/ToastContext";
import { getUserCompanies } from "@/services/companies.service";
import {
  getUserForms,
  createForm,
  updateForm,
  deleteForm,
  archiveForm,
  getFormWithFields,
} from "@/services/forms.service";
import { parseSupabaseError, formatDate, truncate } from "@/lib/utils";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import {
  AddEditForm,
  type FormBuilderData as FormFormData,
  type FormField,
} from "@/components/forms/AddEditForm";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import type { Tables } from "@/types/database";
import type { FormWithFields } from "@/services/forms.service";

type FormWithCount = Tables<"forms"> & { job_count: number };
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

interface FormActionsRowProps {
  form: FormWithCount;
  onEdit: (f: FormWithCount) => void;
  onArchive: (f: FormWithCount) => void;
  onDelete: (f: FormWithCount) => void;
}

function FormActionsRow({ form, onEdit, onArchive, onDelete }: FormActionsRowProps) {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const visibleCount = isMd ? 2 : 1;
  const showEditAsButton = visibleCount >= 2;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {/* Răspunsuri — primary, always visible */}
      <Tooltip title={!isSm ? "Răspunsuri" : ""}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          component={Link}
          href={`/dashboard/forms/${form.id}/responses`}
          startIcon={isSm ? <VisibilityOutlinedIcon fontSize="small" /> : undefined}
          sx={{ minWidth: 0, px: isSm ? 1.5 : 1, fontWeight: 600, boxShadow: "none", "&:hover": { boxShadow: "none" }, whiteSpace: "nowrap" }}
        >
          {isSm ? "Vezi răspunsuri" : <VisibilityOutlinedIcon fontSize="small" />}
        </Button>
      </Tooltip>

      {/* Editează — secondary, desktop only */}
      {showEditAsButton && (
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => onEdit(form)}
          startIcon={<EditIcon fontSize="small" />}
          sx={{ fontWeight: 500, whiteSpace: "nowrap", boxShadow: "none" }}
        >
          Editează
        </Button>
      )}

      {/* Overflow menu */}
      <Tooltip title="Mai multe acțiuni">
        <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ color: "text.secondary" }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2, mt: 0.5 } } }}
      >
        {/* Editează — only in menu on tablet/mobile */}
        {!showEditAsButton && (
          <MuiMenuItem onClick={() => { onEdit(form); setMenuAnchor(null); }} sx={{ gap: 1.5, py: 1 }}>
            <ListItemIcon sx={{ minWidth: 0, color: "secondary.main" }}>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Editează" primaryTypographyProps={{ variant: "body2", color: "secondary.main", fontWeight: 500 }} />
          </MuiMenuItem>
        )}

        {/* Arhivează — feature-gated */}
        {appSettings.features.archiveJobs && !showEditAsButton && <Divider key="archive-divider" />}
        {appSettings.features.archiveJobs && (
          <MuiMenuItem key="archive" onClick={() => { onArchive(form); setMenuAnchor(null); }} sx={{ gap: 1.5, py: 1 }}>
            <ListItemIcon sx={{ minWidth: 0, color: "error.main" }}>
              <ArchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Arhivează" primaryTypographyProps={{ variant: "body2", color: "warning.main", fontWeight: 500 }} />
          </MuiMenuItem>
        )}

        {/* Șterge — destructive, always last */}
        {/* <Divider />
        <MuiMenuItem onClick={() => { onDelete(form); setMenuAnchor(null); }} sx={{ gap: 1.5, py: 1 }}>
          <ListItemIcon sx={{ minWidth: 0, color: "error.main" }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Șterge" primaryTypographyProps={{ variant: "body2", color: "error.main", fontWeight: 500 }} />
        </MuiMenuItem> */}
      </Menu>
    </Stack>
  );
};

export function FormsClient() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const { showToast } = useToast();

  const [forms, setForms] = useState<FormWithCount[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");

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
          showToast("Formular actualizat cu succes.");
        } else {
          await createForm(
            supabase,
            { name: data.name, description: data.description || null, company_id: data.company_id, status },
            dbFields
          );
          setMessage({ type: "success", text: status === "published" ? "Formularul a fost publicat." : "Formularul a fost salvat ca ciornă." });
          showToast(status === "published" ? "Formular publicat cu succes." : "Formular salvat ca ciornă.");
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
      showToast(`Formularul „${form.name}" a fost șters.`, "info");
      await load();
    } catch (err) {
      setMessage({ type: "error", text: parseSupabaseError(err) });
    }
  };

  const handleArchiveForm = async (form: FormWithCount) => {
    try {
      await archiveForm(supabase, form.id, true);
      showToast(`Formularul „${form.name}" a fost arhivat.`, "info");
      await load();
    } catch (err) {
      setMessage({ type: "error", text: parseSupabaseError(err) });
    }
  };

  const filteredForms =
    selectedCompanyId === "all"
      ? forms
      : forms.filter((f) => f.company_id === selectedCompanyId);

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <DashboardPageHeader
        title={<Typography variant="h5" fontWeight={700}>Formularele mele</Typography>}
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Creează formulare de aplicare și urmărește răspunsurile pentru anunțurile tale.
          </Typography>
        }
        actions={
          <>
            {companies.length > 1 && (
              <FormControl size="small" sx={{ minWidth: 180, maxWidth: "100%" }}>
                <InputLabel>Companie</InputLabel>
                <Select
                  label="Companie"
                  value={selectedCompanyId}
                  onChange={(e: SelectChangeEvent) => setSelectedCompanyId(e.target.value)}
                >
                  <MenuItem value="all">Toate companiile</MenuItem>
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={companies.length === 0}>
              Formular nou
            </Button>
          </>
        }
      />

      {/* ── No companies warning ────────────────────────────────────────────── */}
      {!loading && companies.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2 }}>
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
      {!loading && companies.length > 0 && filteredForms.length === 0 && (
        <Paper sx={{ p: 6, textAlign: "center", border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2 }}>
          <ArticleOutlinedIcon sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {selectedCompanyId === "all" ? "Niciun formular creat" : "Niciun formular pentru această companie"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {selectedCompanyId === "all"
              ? "Creează primul formular de aplicare și leagă-l de un anunț de muncă."
              : "Adaugă un formular nou pentru compania selectată."}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Creează primul formular
          </Button>
        </Paper>
      )}

      {/* ── Forms list ──────────────────────────────────────────────────────── */}
      {!loading && filteredForms.length > 0 && (
        <Stack spacing={1.5}>
          {filteredForms.map((form) => (
            <Paper
              key={form.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 3,
                py: 2,
                border: "1px solid rgba(3, 23, 12, 0.1)",
                borderRadius: 2,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                "&:hover": { borderColor: "rgba(62, 92, 118, 0.35)", boxShadow: "0 4px 20px rgba(3, 23, 12, 0.08)" },
              }}
            >
              <ArticleOutlinedIcon sx={{ color: "text.secondary", flexShrink: 0 }} />

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Stack direction="column" spacing={0.5}>
                    <Typography variant="subtitle2" fontWeight={700}
                      sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                      {truncate(form.name)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary"
                      sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                      {truncate(form.description ?? "")}
                    </Typography>
                  </Stack>

                  <Chip
                    label={form.status}
                    size="small"
                    color={statusColor[form.status] ?? "default"}
                    sx={{ height: 20, fontSize: "0.68rem" }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  folosit în {form.job_count} {form.job_count === 1 ? "anunț" : "anunțuri"} • creat {formatDate(form.created_at)}
                </Typography>
              </Box>

              <Box sx={{ flexShrink: 0 }}>
                <FormActionsRow
                  form={form}
                  onEdit={openEdit}
                  onArchive={handleArchiveForm}
                  onDelete={handleDelete}
                />
              </Box>
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
