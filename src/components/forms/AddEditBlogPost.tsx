"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddIcon from "@mui/icons-material/Add";
import { blogPostSchema, type BlogPostFormData } from "@/components/forms/validations/blog.schema";
import { MarkdownEditor } from "@/components/blog/MarkdownEditor";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { BorderedCard } from "@/components/common/BorderedCard";
import { useToast } from "@/contexts/ToastContext";
import { slugify, readingTimeMinutes } from "@/lib/blog/markdown";
import type { BlogPost } from "@/services/blog.service";

interface AddEditBlogPostProps {
  /** When provided, the form is in edit mode. */
  initialData?: BlogPost;
  onSave: (data: BlogPostFormData, prevStatus: string) => Promise<{ ok: boolean; slug?: string; error?: string }>;
}

export function AddEditBlogPost({ initialData, onSave }: AddEditBlogPostProps) {
  const { showToast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData));

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      excerpt: initialData?.excerpt ?? "",
      cover_image_url: initialData?.cover_image_url ?? "",
      content_markdown: initialData?.content_markdown ?? "",
      status: (initialData?.status as BlogPostFormData["status"]) ?? "draft",
      seo_title: initialData?.seo_title ?? "",
      seo_description: initialData?.seo_description ?? "",
      tags: initialData?.tags ?? [],
      canonical_url: initialData?.canonical_url ?? "",
    },
  });

  const titleValue = watch("title");
  const contentValue = watch("content_markdown");
  const tagsValue = watch("tags");
  const estimatedReadingTime = readingTimeMinutes(contentValue);

  // Auto-derive slug from title until the user touches the slug field
  useEffect(() => {
    if (!slugTouched && titleValue) {
      setValue("slug", slugify(titleValue), { shouldValidate: false });
    }
  }, [titleValue, slugTouched, setValue]);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tagsValue.includes(tag) && tagsValue.length < 10) {
      setValue("tags", [...tagsValue, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue("tags", tagsValue.filter((t) => t !== tag));
  };

  const onSubmit = async (data: BlogPostFormData) => {
    const prevStatus = initialData?.status ?? "draft";
    const result = await onSave(data, prevStatus);
    if (result.ok) {
      showToast(
        initialData ? "Articol actualizat cu succes." : "Articol creat cu succes.",
        "success"
      );
    } else {
      showToast(result.error ?? "A apărut o eroare.", "error", 5000);
    }
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
    >
      {/* ── Identificare ──────────────────────────────────────────────────── */}
      <BorderedCard>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Identificare
        </Typography>
        <Stack spacing={2}>
          <TextField
            {...register("title")}
            label="Titlu articol"
            required
            fullWidth
            error={!!errors.title}
            helperText={errors.title?.message}
            inputProps={{
              "aria-describedby": errors.title ? "title-error" : undefined,
              "aria-required": "true",
            }}
          />
          <TextField
            {...register("slug")}
            label="Slug URL"
            required
            fullWidth
            error={!!errors.slug}
            helperText={errors.slug?.message ?? "Folosit în URL: /blog/slug-articol"}
            onFocus={() => setSlugTouched(true)}
            inputProps={{
              "aria-describedby": errors.slug ? "slug-error" : "slug-hint",
              "aria-required": "true",
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="body2" color="text.secondary">/blog/</Typography>
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </BorderedCard>

      {/* ── Conținut ──────────────────────────────────────────────────────── */}
      <BorderedCard>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Conținut
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              ~{estimatedReadingTime} min lectură
            </Typography>
            <Tooltip title={showPreview ? "Ascunde previzualizare" : "Arată previzualizare"}>
              <IconButton
                size="small"
                onClick={() => setShowPreview((v) => !v)}
                aria-label={showPreview ? "Ascunde previzualizare" : "Arată previzualizare"}
                aria-expanded={showPreview}
              >
                {showPreview ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Controller
          name="content_markdown"
          control={control}
          render={({ field }) => (
            <MarkdownEditor
              value={field.value}
              onChange={field.onChange}
              error={!!errors.content_markdown}
              helperText={errors.content_markdown?.message}
              minHeight={400}
            />
          )}
        />

        <Collapse in={showPreview} unmountOnExit>
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              Previzualizare
            </Typography>
            <MarkdownRenderer markdown={contentValue} />
          </Box>
        </Collapse>
      </BorderedCard>

      {/* ── Metadate ──────────────────────────────────────────────────────── */}
      <BorderedCard>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Metadate
        </Typography>
        <Stack spacing={2}>
          <TextField
            {...register("excerpt")}
            label="Rezumat (excerpt)"
            fullWidth
            multiline
            rows={3}
            error={!!errors.excerpt}
            helperText={errors.excerpt?.message ?? "Scurt rezumat afișat în lista de articole (max 300 caractere)"}
          />
          <TextField
            {...register("cover_image_url")}
            label="URL imagine copertă"
            fullWidth
            type="url"
            error={!!errors.cover_image_url}
            helperText={errors.cover_image_url?.message}
          />

          {/* Tag management */}
          <Box>
            <FormLabel component="legend" sx={{ mb: 1, fontSize: "0.875rem" }}>
              Etichete (max 10)
            </FormLabel>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
              {tagsValue.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => removeTag(tag)}
                />
              ))}
            </Stack>
            {tagsValue.length < 10 && (
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTag(); }
                  }}
                  placeholder="Adaugă etichetă"
                  inputProps={{ "aria-label": "Etichetă nouă" }}
                  sx={{ maxWidth: 220 }}
                />
                <IconButton size="small" onClick={addTag} aria-label="Adaugă etichetă">
                  <AddIcon fontSize="small" />
                </IconButton>
              </Stack>
            )}
            {errors.tags && (
              <FormHelperText error>{errors.tags.message}</FormHelperText>
            )}
          </Box>

          <TextField
            label="Timp estimat de lectură"
            value={`${estimatedReadingTime} min`}
            InputProps={{ readOnly: true }}
            size="small"
            sx={{ maxWidth: 180 }}
            helperText="Calculat automat"
          />
        </Stack>
      </BorderedCard>

      {/* ── SEO ───────────────────────────────────────────────────────────── */}
      <BorderedCard>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          SEO
        </Typography>
        <Stack spacing={2}>
          <TextField
            {...register("seo_title")}
            label="SEO Titlu"
            fullWidth
            error={!!errors.seo_title}
            helperText={
              errors.seo_title?.message ??
              `${getValues("seo_title")?.length ?? 0}/70 caractere`
            }
          />
          <TextField
            {...register("seo_description")}
            label="SEO Descriere"
            fullWidth
            multiline
            rows={2}
            error={!!errors.seo_description}
            helperText={
              errors.seo_description?.message ??
              `${getValues("seo_description")?.length ?? 0}/160 caractere`
            }
          />
          <TextField
            {...register("canonical_url")}
            label="URL canonic"
            fullWidth
            type="url"
            error={!!errors.canonical_url}
            helperText={errors.canonical_url?.message ?? "Lasă gol pentru URL implicit"}
          />
        </Stack>
      </BorderedCard>

      {/* ── Publicare ─────────────────────────────────────────────────────── */}
      <BorderedCard>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Publicare
        </Typography>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <FormControl error={!!errors.status}>
              <FormLabel id="status-label">Status</FormLabel>
              <RadioGroup
                aria-labelledby="status-label"
                value={field.value}
                onChange={field.onChange}
                row
              >
                <FormControlLabel value="draft" control={<Radio />} label="Ciornă" />
                <FormControlLabel value="published" control={<Radio />} label="Publicat" />
                <FormControlLabel value="archived" control={<Radio />} label="Arhivat" />
              </RadioGroup>
              {errors.status && (
                <FormHelperText>{errors.status.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
            sx={{ minHeight: 44 }}
          >
            {isSubmitting ? "Se salvează…" : "Salvează"}
          </Button>
          <Button
            type="button"
            variant="outlined"
            disabled={isSubmitting}
            onClick={() => {
              setValue("status", "published");
              void handleSubmit(onSubmit)();
            }}
            sx={{ minHeight: 44 }}
          >
            Salvează și publică
          </Button>
        </Stack>
      </BorderedCard>
    </Box>
  );
}
