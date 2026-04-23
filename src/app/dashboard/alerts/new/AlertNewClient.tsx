"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Container, Typography, Paper } from "@mui/material";
import { AlertForm } from "@/components/alerts/AlertForm";
import { createAlert, serializeFilters } from "@/services/alerts.service";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/contexts/ToastContext";
import type { AlertFormData } from "@/components/forms/validations/alert.schema";
import type { JobType, ExperienceLevel } from "@/types";

export function AlertNewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = useSupabase();
  const { showToast } = useToast();

  const defaultValues: Partial<AlertFormData> = {};

  const q = searchParams.get("q");
  if (q) defaultValues.q = q;

  const location = searchParams.get("location");
  if (location) defaultValues.location = location;

  const type = searchParams.get("type");
  if (type) defaultValues.type = type as JobType;

  const experience = searchParams.get("experience");
  if (experience) defaultValues.experience = experience as ExperienceLevel;

  const salaryMin = searchParams.get("salaryMin");
  if (salaryMin) defaultValues.salaryMin = Number(salaryMin);

  const salaryMax = searchParams.get("salaryMax");
  if (salaryMax) defaultValues.salaryMax = Number(salaryMax);

  const remote = searchParams.get("remote");
  if (remote === "true")  defaultValues.remote = true;
  if (remote === "false") defaultValues.remote = false;

  const minBenefits = searchParams.get("minBenefits");
  if (minBenefits) defaultValues.minBenefits = Number(minBenefits);

  const handleSubmit = async (data: AlertFormData) => {
    if (!user) return;
    const { name, ...rest } = data;
    const filters = serializeFilters(rest);
    await createAlert(supabase, { user_id: user.id, name, filters });
    showToast("Alertă creată cu succes.");
    router.push("/dashboard/alerts");
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 0.5 }}>
        Creează alertă
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vei primi un email ori de câte ori apar anunțuri noi care corespund filtrelor tale.
      </Typography>

      <Paper
        sx={{
          p: { xs: 2.5, sm: 4 },
          border: "1px solid rgba(3, 23, 12, 0.1)",
          borderRadius: 2,
        }}
      >
        <AlertForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitLabel="Creează alerta"
          onCancel={() => router.back()}
        />
      </Paper>
      <Box sx={{ mt: 2 }} />
    </Container>
  );
}
