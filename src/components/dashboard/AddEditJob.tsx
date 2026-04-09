"use client";

import React, { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  Typography,
  TextField,
  Button,
  Stack,
  Box,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  InputAdornment,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormLabel,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckIcon from "@mui/icons-material/Check";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/hooks/useSupabase";
import { jobTypeLabels, experienceLevelLabels, parseSupabaseError } from "@/lib/utils";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import { AddEditForm, type FormData as FormFormData, type FormField } from "@/components/dashboard/AddEditForm";
import { createForm } from "@/services/forms.service";
import {
  getJobBenefits,
  createBenefit,
  updateBenefit,
  deleteBenefit,
  reorderBenefits,
  type BenefitItem,
} from "@/services/benefits.service";
import type { Tables } from "@/types/database";
import appSettings from "@/config/app.settings.json";

export const schema = z.object({
  company_id: z.string().min(1, "Selectează o companie"),
  title: z.string().min(3, "Titlul este obligatoriu"),
  description: z
    .string()
    .refine(
      (v) => v.replace(/<[^>]*>/g, "").trim().length >= 10,
      "Descrierea trebuie să aibă cel puțin 10 caractere"
    ),
  location: z.string().optional().or(z.literal("")),
  job_type: z.string().optional().or(z.literal("")),
  experience_level: z.array(z.string()),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  is_remote: z.boolean(),
  application_method: z.enum(["none", "url", "form"]),
  application_url: z.string().url("Introdu un URL valid").optional().or(z.literal("")),
  form_id: z.string().optional().or(z.literal("")),
});

export type JobFormData = z.infer<typeof schema>;

export type CompanyOption = { id: string; name: string };

export type JobWithCompany = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};

export type BenefitDraft = { title: string; sort_order: number };

export interface AddEditJobHandle {
  submit: () => Promise<void>;
}

interface AddEditJobProps {
  companies: CompanyOption[];
  editingJob: JobWithCompany | null;
  defaultValues: JobFormData;
  onSubmit: (data: JobFormData, status: "draft" | "published", newBenefits?: BenefitDraft[]) => Promise<void>;
  onDelete?: () => void;
  onCancel: () => void;
  /** Hides the built-in action buttons — caller controls submission via ref.submit() */
  hideActions?: boolean;
  /** Disables internal form creation; hides "Formular intern" radio option */
  wizardMode?: boolean;
}

export const AddEditJob = forwardRef<AddEditJobHandle, AddEditJobProps>(function AddEditJob({
  companies,
  editingJob,
  defaultValues,
  onSubmit,
  onDelete,
  onCancel,
  hideActions,
  wizardMode,
}, ref) {
  const supabase = useSupabase();
  const [formsList, setFormsList] = useState<{ id: string; name: string }[]>([]);
  const [pendingStatus, setPendingStatus] = useState<"draft" | "published" | null>(null);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [formDrawerMessage, setFormDrawerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Benefits ─────────────────────────────────────────────────────────────
  const [benefits, setBenefits] = useState<(BenefitItem | { id: string; title: string; sort_order: number; isLocal: true })[]>([]);
  const [newBenefit, setNewBenefit] = useState("");
  const [editingBenefitId, setEditingBenefitId] = useState<string | null>(null);
  const [editingBenefitTitle, setEditingBenefitTitle] = useState("");

  useEffect(() => {
    if (editingJob) {
      getJobBenefits(supabase, editingJob.id).then(setBenefits).catch(() => {});
    }
  }, [editingJob, supabase]);

  const addBenefit = useCallback(async () => {
    const title = newBenefit.trim();
    if (!title) return;
    const nextOrder = benefits.length;
    if (editingJob) {
      try {
        const created = await createBenefit(supabase, { job_id: editingJob.id, title, sort_order: nextOrder });
        setBenefits((prev) => [...prev, created]);
      } catch { /* silently ignore */ }
    } else {
      setBenefits((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, title, sort_order: nextOrder, isLocal: true as const },
      ]);
    }
    setNewBenefit("");
  }, [newBenefit, benefits.length, editingJob, supabase]);

  const removeBenefit = useCallback(async (id: string) => {
    if (editingJob && !id.startsWith("local-")) {
      try { await deleteBenefit(supabase, id); } catch { /* silently ignore */ }
    }
    setBenefits((prev) => {
      const updated = prev.filter((b) => b.id !== id).map((b, i) => ({ ...b, sort_order: i }));
      if (editingJob) {
        reorderBenefits(supabase, updated.filter((b) => !("isLocal" in b)).map((b) => ({ id: b.id, sort_order: b.sort_order }))).catch(() => {});
      }
      return updated;
    });
  }, [editingJob, supabase]);

  const saveBenefitEdit = useCallback(async (id: string) => {
    const title = editingBenefitTitle.trim();
    if (!title) return;
    if (editingJob && !id.startsWith("local-")) {
      try { await updateBenefit(supabase, id, { title }); } catch { /* silently ignore */ }
    }
    setBenefits((prev) => prev.map((b) => b.id === id ? { ...b, title } : b));
    setEditingBenefitId(null);
  }, [editingBenefitTitle, editingJob, supabase]);

  const moveBenefit = useCallback(async (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= benefits.length) return;
    const reordered = [...benefits];
    [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
    const withOrder = reordered.map((b, i) => ({ ...b, sort_order: i }));
    setBenefits(withOrder);
    if (editingJob) {
      reorderBenefits(supabase, withOrder.filter((b) => !("isLocal" in b)).map((b) => ({ id: b.id, sort_order: b.sort_order }))).catch(() => {});
    }
  }, [benefits, editingJob, supabase]);

  const {
    handleSubmit,
    control,
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JobFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useImperativeHandle(ref, () => ({
    submit: () => {
      const localBenefits = benefits.map((b) => ({ title: b.title, sort_order: b.sort_order }));
      return handleSubmit((data) => onSubmit(data, "published", localBenefits))();
    },
  }));

  const loadForms = useCallback(
    async (companyId: string) => {
      const { data } = await supabase
        .from("forms")
        .select("id, name")
        .eq("company_id", companyId);
      setFormsList(data ?? []);
    },
    [supabase]
  );

  const selectedCompanyId = watch("company_id");
  useEffect(() => {
    if (selectedCompanyId) loadForms(selectedCompanyId);
  }, [selectedCompanyId, loadForms]);

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

  const handleCreateForm = useCallback(
    async (data: FormFormData, fields: FormField[], status: "draft" | "published") => {
      setFormDrawerMessage(null);
      try {
        const newForm = await createForm(
          supabase,
          { name: data.name, description: data.description || null, company_id: selectedCompanyId, status },
          fieldTypesToDb(fields)
        );
        await loadForms(selectedCompanyId);
        setValue("form_id", newForm.id);
        setFormDrawerMessage({ type: "success", text: "Formularul a fost creat." });
        setTimeout(() => setFormDrawerOpen(false), 700);
      } catch (err) {
        setFormDrawerMessage({ type: "error", text: parseSupabaseError(err) });
      }
    },
    [supabase, selectedCompanyId, loadForms, setValue]
  );

  return (
    <Box component="form" onSubmit={(e) => e.preventDefault()}>
      <Stack spacing={2.5}>
        {!editingJob && companies.length > 1 && (
          <Controller
            name="company_id"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required error={!!errors.company_id}>
                <InputLabel>Companie</InputLabel>
                <Select {...field} label="Companie">
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.company_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {errors.company_id.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        )}

        <TextField
          {...register("title")}
          label="Titlul postului"
          fullWidth
          required
          error={!!errors.title}
          helperText={errors.title?.message}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Descrie rolul, responsabilitățile, cerințele..."
              error={!!errors.description}
              helperText={errors.description?.message}
              minHeight={240}
            />
          )}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField {...register("location")} label="Locație" fullWidth />
          <Controller
            name="is_remote"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch checked={field.value} onChange={field.onChange} color="primary" />
                }
                label="Remote"
                sx={{ mt: 1 }}
              />
            )}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Controller
            name="job_type"
            control={control}
            render={({ field }) => (
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Tip de contract</InputLabel>
                <Select {...field} label="Tip de contract" value={field.value ?? ""}>
                  <MenuItem value="">Nespecificat</MenuItem>
                  {Object.entries(jobTypeLabels).map(([val, label]) => (
                    <MenuItem key={val} value={val}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            name="experience_level"
            control={control}
            render={({ field }) => {
              const LEVELS = Object.keys(experienceLevelLabels);
              const selected: string[] = field.value ?? [];
              const toggle = (val: string) => {
                if (selected.includes(val)) {
                  field.onChange(selected.filter((v) => v !== val));
                  return;
                }
                if (selected.length === 0) {
                  field.onChange([val]);
                  return;
                }
                const valIdx = LEVELS.indexOf(val);
                const sortedIdxs = selected.map((v) => LEVELS.indexOf(v)).sort((a, b) => a - b);
                if (selected.length === 1) {
                  const [idx] = sortedIdxs;
                  if (Math.abs(valIdx - idx) === 1) {
                    field.onChange([LEVELS[Math.min(idx, valIdx)], LEVELS[Math.max(idx, valIdx)]]);
                  } else {
                    field.onChange([val]);
                  }
                  return;
                }
                // 2 selected: slide the window or restart
                const [lo, hi] = sortedIdxs;
                if (valIdx === lo - 1) {
                  field.onChange([val, LEVELS[lo]]);
                } else if (valIdx === hi + 1) {
                  field.onChange([LEVELS[hi], val]);
                } else {
                  field.onChange([val]);
                }
              };
              return (
                <FormControl sx={{ flex: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: "block" }}>
                    Nivel de experiență
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {Object.entries(experienceLevelLabels).map(([val, label]) => (
                      <Chip
                        key={val}
                        label={label}
                        onClick={() => toggle(val)}
                        color={selected.includes(val) ? "primary" : "default"}
                        variant={selected.includes(val) ? "filled" : "outlined"}
                        size="small"
                        sx={{ cursor: "pointer" }}
                      />
                    ))}
                  </Stack>
                </FormControl>
              );
            }}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            {...register("salary_min")}
            label="Salariu minim"
            type="number"
            fullWidth
          />
          <TextField
            {...register("salary_max")}
            label="Salariu maxim"
            type="number"
            fullWidth
          />
        </Stack>

        {/* ── Benefits ─────────────────────────────────────────────────── */}
        <Box>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <CardGiftcardOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="subtitle2" fontWeight={700}>
              Beneficii
            </Typography>
            {benefits.length > 0 && (
              <Chip
                label={benefits.length}
                size="small"
                color="primary"
                sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700 }}
              />
            )}
          </Stack>

          {benefits.length > 0 && (
            <Stack spacing={0.75} sx={{ mb: 1.5 }}>
              {benefits.map((benefit, idx) => (
                <Stack
                  key={benefit.id}
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    border: "1px solid",
                    borderColor: editingBenefitId === benefit.id ? "primary.main" : "divider",
                    borderRadius: 1.5,
                    bgcolor: "background.paper",
                  }}
                >
                  {editingBenefitId === benefit.id ? (
                    <TextField
                      value={editingBenefitTitle}
                      onChange={(e) => setEditingBenefitTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); saveBenefitEdit(benefit.id); }
                        if (e.key === "Escape") setEditingBenefitId(null);
                      }}
                      size="small"
                      variant="standard"
                      autoFocus
                      sx={{ flex: 1 }}
                      slotProps={{ input: { disableUnderline: false } }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ flex: 1, cursor: "text" }}
                      onDoubleClick={() => {
                        setEditingBenefitId(benefit.id);
                        setEditingBenefitTitle(benefit.title);
                      }}
                    >
                      {benefit.title}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={0.25}>
                    {editingBenefitId === benefit.id ? (
                      <Tooltip title="Salvează">
                        <IconButton size="small" color="primary" onClick={() => saveBenefitEdit(benefit.id)}>
                          <CheckIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <>
                        <Tooltip title="Mută sus"><span>
                          <IconButton size="small" onClick={() => moveBenefit(idx, -1)} disabled={idx === 0}
                            sx={{ color: "text.secondary" }}>
                            <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </span></Tooltip>
                        <Tooltip title="Mută jos"><span>
                          <IconButton size="small" onClick={() => moveBenefit(idx, 1)} disabled={idx === benefits.length - 1}
                            sx={{ color: "text.secondary" }}>
                            <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </span></Tooltip>
                        <Tooltip title="Editează">
                          <IconButton size="small" sx={{ color: "text.secondary" }}
                            onClick={() => { setEditingBenefitId(benefit.id); setEditingBenefitTitle(benefit.title); }}>
                            <CheckIcon sx={{ fontSize: 14, transform: "scaleX(-1)" }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="Șterge">
                      <IconButton size="small" sx={{ color: "error.main" }} onClick={() => removeBenefit(benefit.id)}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}

          <TextField
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBenefit(); } }}
            size="small"
            placeholder="ex. Asigurare medicală privată"
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      variant="contained"
                      disableElevation
                      onClick={addBenefit}
                      disabled={!newBenefit.trim()}
                      sx={{ minWidth: 0, px: 1.5, py: 0.5, fontSize: "0.75rem", borderRadius: 1 }}
                    >
                      Adaugă
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Controller
          name="application_method"
          control={control}
          render={({ field }) => (
            <FormControl component="fieldset">
              <FormLabel
                component="h3"
                sx={{ mb: 1, fontSize: "0.875rem", fontWeight: 600 }}
              >
                Unde vor aplica candidații?
              </FormLabel>
              <RadioGroup row {...field}>
                <FormControlLabel
                  value="url"
                  control={<Radio size="small" />}
                  label="URL extern"
                />
                {appSettings.features.forms && !wizardMode && (
                  <FormControlLabel
                    value="form"
                    control={<Radio size="small" />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <span>Formular intern personalizat</span>
                        <Tooltip
                          title="Creează, gestionează și publică formulare de aplicare complet gratuit. Pentru a salva timp, poți refolosi același formular pentru multiple anunțuri de muncă."
                          placement="top"
                          arrow
                        >
                          <InfoOutlinedIcon sx={{ fontSize: 15, color: "text.secondary", cursor: "help" }} />
                        </Tooltip>
                      </Stack>
                    }
                  />
                )}
              </RadioGroup>
            </FormControl>
          )}
        />

        {watch("application_method") === "url" && (
          <TextField
            {...register("application_url")}
            label="Unde vrei să redirecționăm candidații?"
            fullWidth
            placeholder="https://..."
            error={!!errors.application_url}
            helperText={errors.application_url?.message}
          />
        )}

        {watch("application_method") === "form" &&
          (formsList.length > 0 ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Controller
                name="form_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Formular de aplicare</InputLabel>
                    <Select {...field} label="Formular de aplicare" value={field.value ?? ""}>
                      <MenuItem value="">Selectează...</MenuItem>
                      {formsList.map((form) => (
                        <MenuItem key={form.id} value={form.id}>
                          {form.name || `Formular ${form.id}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => { setFormDrawerMessage(null); setFormDrawerOpen(true); }}
                sx={{ whiteSpace: "nowrap", flexShrink: 0, height: "55px" }}
              >
                Formular nou
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                Niciun formular creat pentru această companie.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => { setFormDrawerMessage(null); setFormDrawerOpen(true); }}
                sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
              >
                Creează formular
              </Button>
            </Stack>
          ))}

        <EditSideDrawer
          open={formDrawerOpen}
          onClose={() => setFormDrawerOpen(false)}
          title="Formular nou de aplicare"
          message={formDrawerMessage}
          onMessageClose={() => setFormDrawerMessage(null)}
          width={560}
        >
          <AddEditForm
            companies={companies.map((c) => ({ id: c.id, name: c.name }))}
            editingForm={null}
            defaultValues={{ name: "", description: "", company_id: selectedCompanyId }}
            defaultFields={[]}
            onSubmit={handleCreateForm}
            onCancel={() => setFormDrawerOpen(false)}
          />
        </EditSideDrawer>

        {!hideActions && (
          <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="secondary"
              disabled={isSubmitting || pendingStatus !== null}
              sx={{ px: 4 }}
              onClick={() => {
                setPendingStatus("draft");
                const localBenefits = editingJob ? undefined : benefits.map((b) => ({ title: b.title, sort_order: b.sort_order }));
                handleSubmit((data) => onSubmit(data, "draft", localBenefits))().finally(() =>
                  setPendingStatus(null)
                );
              }}
            >
              {pendingStatus === "draft"
                ? "Se salvează..."
                : editingJob
                ? "Actualizează anunțul"
                : "Salvează ciornă"}
            </Button>

            {!editingJob && (
              <Button
                variant="contained"
                color="primary"
                disabled={isSubmitting || pendingStatus !== null}
                sx={{ px: 4 }}
                onClick={() => {
                  setPendingStatus("published");
                  const localBenefits = editingJob ? undefined : benefits.map((b) => ({ title: b.title, sort_order: b.sort_order }));
                  handleSubmit((data) => onSubmit(data, "published", localBenefits))().finally(() =>
                    setPendingStatus(null)
                  );
                }}
              >
                {pendingStatus === "published" ? "Se publică..." : "Publică anunț"}
              </Button>
            )}

            {onDelete && (
              <Button variant="outlined" color="error" onClick={onDelete}>
                Șterge
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
});
