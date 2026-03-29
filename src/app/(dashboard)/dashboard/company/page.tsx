"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Alert,
  Box,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserCompanies, createCompany, updateCompany } from "@/services/companies.service";
import { slugify } from "@/lib/utils";
import type { Tables } from "@/types/database";

const schema = z.object({
  name: z.string().min(2, "Company name is required"),
  description: z.string().optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  size: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  founded_year: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CompanyPage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  const [company, setCompany] = useState<Tables<"companies"> | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!user) return;
    getUserCompanies(supabase, user.id)
      .then((companies) => {
        if (companies.length > 0 && companies[0].companies) {
          const c = companies[0].companies;
          setCompany(c);
          reset({
            name: c.name,
            description: c.description ?? "",
            website: c.website ?? "",
            industry: c.industry ?? "",
            size: c.size ?? "",
            location: c.location ?? "",
            founded_year: c.founded_year?.toString() ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [user, supabase, reset]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!user) return;
      setMessage(null);

      try {
        if (company) {
          const updated = await updateCompany(supabase, company.id, {
            name: data.name,
            slug: slugify(data.name),
            description: data.description || null,
            website: data.website || null,
            industry: data.industry || null,
            size: data.size || null,
            location: data.location || null,
            founded_year: data.founded_year ? Number(data.founded_year) : null,
          });
          setCompany(updated);
          setMessage({ type: "success", text: "Company updated." });
        } else {
          const created = await createCompany(
            supabase,
            {
              name: data.name,
              slug: slugify(data.name),
              description: data.description || null,
              website: data.website || null,
              industry: data.industry || null,
              size: data.size || null,
              location: data.location || null,
              founded_year: data.founded_year ? Number(data.founded_year) : null,
              created_by: user.id,
            },
            user.id
          );
          setCompany(created);
          setMessage({ type: "success", text: "Company created." });
          router.refresh();
        }
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    },
    [user, supabase, company, router]
  );

  if (loading) return null;

  return (
    <>
      <Typography variant="h3" sx={{ mb: 3 }}>
        {company ? "Manage Company" : "Create Company"}
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
            <TextField
              {...register("name")}
              label="Company Name"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              {...register("description")}
              label="Description"
              fullWidth
              multiline
              rows={4}
            />
            <TextField
              {...register("website")}
              label="Website"
              fullWidth
              error={!!errors.website}
              helperText={errors.website?.message}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField {...register("industry")} label="Industry" fullWidth />
              <TextField
                {...register("size")}
                label="Company Size"
                fullWidth
                placeholder="e.g. 10-50"
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField {...register("location")} label="Location" fullWidth />
              <TextField
                {...register("founded_year")}
                label="Founded Year"
                type="number"
                fullWidth
                error={!!errors.founded_year}
                helperText={errors.founded_year?.message}
              />
            </Stack>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ alignSelf: "flex-start", px: 4 }}
            >
              {isSubmitting ? "Saving..." : company ? "Update Company" : "Create Company"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
