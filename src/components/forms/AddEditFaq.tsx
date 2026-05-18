"use client";

import React, { useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Tables } from "@/types/database";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import { faqSchema, type FaqFormData } from "@/components/forms/validations/faq.schema";
import type { FaqPageTab } from "@/services/faq.service";

export interface AddEditFaqProps {
  open: boolean;
  onClose: () => void;
  /** null = create */
  editing: Tables<"faq"> | null;
  /** Default „Pagină” when creating (current admin tab); user may choose „Ambele”. */
  defaultPlacement: FaqPageTab;
  onSubmit: (data: FaqFormData) => Promise<void>;
}

const placementLabels: Record<FaqFormData["placement"], string> = {
  home: "Pagina principală",
  how_it_works: "Cum funcționează",
  both: "Ambele",
};

export function AddEditFaq({
  open,
  onClose,
  editing,
  defaultPlacement,
  onSubmit,
}: AddEditFaqProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema) as Resolver<FaqFormData>,
    defaultValues: {
      placement: defaultPlacement,
      question: "",
      answer: "",
      sort_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      if (editing) {
        reset({
          placement: editing.placement as FaqFormData["placement"],
          question: editing.question,
          answer: editing.answer,
          sort_order: editing.sort_order,
          is_active: editing.is_active,
        });
      } else {
        reset({
          placement: defaultPlacement,
          question: "",
          answer: "",
          sort_order: 0,
          is_active: true,
        });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open, editing, defaultPlacement, reset]);

  const title = editing ? "Editează întrebarea" : "Întrebare nouă";

  return (
    <EditSideDrawer open={open} onClose={onClose} title={title} width={560}>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(async (data) => {
          await onSubmit(data);
          onClose();
        })}
        aria-label={editing ? "Formular editare FAQ" : "Formular întrebare FAQ nouă"}
      >
        <Stack spacing={2.5}>
          <FormControl fullWidth error={!!errors.placement}>
            <InputLabel id="faq-placement-label">Pagină</InputLabel>
            <Controller
              name="placement"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="faq-placement-label"
                  label="Pagină"
                  inputProps={{
                    "aria-describedby": errors.placement ? "faq-placement-error" : undefined,
                  }}
                >
                  <MenuItem value="home">{placementLabels.home}</MenuItem>
                  <MenuItem value="how_it_works">{placementLabels.how_it_works}</MenuItem>
                  <MenuItem value="both">{placementLabels.both}</MenuItem>
                </Select>
              )}
            />
            {errors.placement ? (
              <FormHelperText id="faq-placement-error" role="alert">
                {errors.placement.message}
              </FormHelperText>
            ) : null}
          </FormControl>

          <TextField
            {...register("question")}
            label="Întrebare"
            required
            fullWidth
            multiline
            minRows={2}
            error={!!errors.question}
            helperText={errors.question?.message}
            inputProps={{ "aria-describedby": errors.question ? "faq-question-error" : undefined }}
            FormHelperTextProps={
              errors.question?.message
                ? { id: "faq-question-error", role: "alert" as const }
                : undefined
            }
          />

          <TextField
            {...register("answer")}
            label="Răspuns"
            required
            fullWidth
            multiline
            minRows={6}
            error={!!errors.answer}
            helperText={errors.answer?.message}
            FormHelperTextProps={
              errors.answer?.message ? { id: "faq-answer-error", role: "alert" as const } : undefined
            }
            inputProps={{ "aria-describedby": errors.answer ? "faq-answer-error" : undefined }}
          />

          <TextField
            {...register("sort_order", { valueAsNumber: true })}
            label="Ordine afișare"
            type="number"
            fullWidth
            required
            error={!!errors.sort_order}
            helperText={errors.sort_order?.message}
            inputProps={{
              min: 0,
              step: 1,
              "aria-describedby": errors.sort_order ? "faq-sort-error" : undefined,
            }}
            FormHelperTextProps={
              errors.sort_order?.message ? { id: "faq-sort-error", role: "alert" as const } : undefined
            }
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} />}
                label="Activă (vizibilă pe site)"
              />
            )}
          />

          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Button type="button" variant="outlined" onClick={onClose} disabled={isSubmitting}>
              Anulează
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ px: 4 }}>
              {isSubmitting ? "Se salvează…" : "Salvează"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </EditSideDrawer>
  );
}
