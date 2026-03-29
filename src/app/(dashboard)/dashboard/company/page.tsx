"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Box,
  Avatar,
  Chip,
  IconButton,
  Skeleton,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import BusinessIcon from "@mui/icons-material/Business";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import LanguageIcon from "@mui/icons-material/Language";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getUserCompaniesWithJobCount,
  createCompany,
  updateCompany,
  type CompanyWithJobCount,
} from "@/services/companies.service";
import { slugify, parseSupabaseError } from "@/lib/utils";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";

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

  const [companies, setCompanies] = useState<CompanyWithJobCount[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyWithJobCount | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getUserCompaniesWithJobCount(supabase, user.id);
    setCompanies(data);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setMessage(null);
    reset({ name: "", description: "", website: "", industry: "", size: "", location: "", founded_year: "" });
    setDrawerOpen(true);
  };

  const openEdit = (company: CompanyWithJobCount) => {
    setEditing(company);
    setMessage(null);
    reset({
      name: company.name,
      description: company.description ?? "",
      website: company.website ?? "",
      industry: company.industry ?? "",
      size: company.size ?? "",
      location: company.location ?? "",
      founded_year: company.founded_year?.toString() ?? "",
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setMessage(null);
  };

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!user) return;
      setMessage(null);
      try {
        if (editing) {
          await updateCompany(supabase, editing.id, {
            name: data.name,
            slug: slugify(data.name),
            description: data.description || null,
            website: data.website || null,
            industry: data.industry || null,
            size: data.size || null,
            location: data.location || null,
            founded_year: data.founded_year ? Number(data.founded_year) : null,
          });
          setMessage({ type: "success", text: "Company updated." });
        } else {
          await createCompany(
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
          setMessage({ type: "success", text: "Company created." });
        }
        await load();
        setTimeout(closeDrawer, 900);
      } catch (err) {
        setMessage({ type: "error", text: parseSupabaseError(err) });
      }
    },
    [user, supabase, editing, load]
  );

  if (loading) {
    return (
      <>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Skeleton variant="text" width={160} height={40} />
          <Skeleton variant="rounded" width={140} height={36} />
        </Stack>
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 2 }} />
        ))}
      </>
    );
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h3">Companies</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New Company
        </Button>
      </Stack>

      {companies.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
          <BusinessIcon sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>
            No companies yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create a company to start posting jobs.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Create Company
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {companies.map((company) => (
            <Paper
              key={company.id}
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 2,
                transition: "border-color 0.2s",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <Avatar
                src={company.logo_url ?? undefined}
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                  flexShrink: 0,
                }}
              >
                <BusinessIcon sx={{ color: "text.secondary" }} />
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="h5" noWrap>
                    {company.name}
                  </Typography>
                  <Chip
                    label={company.role}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.65rem", height: 20, textTransform: "capitalize" }}
                  />
                </Stack>

                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }} useFlexGap>
                  {company.industry && (
                    <Chip label={company.industry} size="small" variant="outlined" />
                  )}
                  {company.location && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">
                        {company.location}
                      </Typography>
                    </Stack>
                  )}
                  {company.website && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <LanguageIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography
                        variant="caption"
                        component="a"
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                      >
                        Website
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>

              {/* Job count badge */}
              <Stack
                alignItems="center"
                justifyContent="center"
                component={Link}
                href="/dashboard/jobs"
                sx={{
                  textDecoration: "none",
                  minWidth: 64,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
     
                <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ fontSize: "0.65rem" }}>
                  {company.jobCount}{" "}{company.jobCount === 1 ? "job" : "jobs"}
                </Typography>
              </Stack>

              <IconButton
                size="small"
                onClick={() => openEdit(company)}
                title="Edit company"
                sx={{ flexShrink: 0 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      )}

      <EditSideDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? `Edit: ${editing.name}` : "Create Company"}
        message={message}
        onMessageClose={() => setMessage(null)}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Company Name"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Description" fullWidth multiline rows={4} />
              )}
            />
            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Website"
                  fullWidth
                  error={!!errors.website}
                  helperText={errors.website?.message}
                />
              )}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                name="industry"
                control={control}
                render={({ field }) => <TextField {...field} label="Industry" fullWidth />}
              />
              <Controller
                name="size"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Company Size" fullWidth placeholder="e.g. 10-50" />
                )}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => <TextField {...field} label="Location" fullWidth />}
              />
              <Controller
                name="founded_year"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Founded Year"
                    type="number"
                    fullWidth
                    error={!!errors.founded_year}
                    helperText={errors.founded_year?.message}
                  />
                )}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ px: 4 }}>
                {isSubmitting ? "Saving..." : editing ? "Update Company" : "Create Company"}
              </Button>
              <Button variant="outlined" onClick={closeDrawer}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </EditSideDrawer>
    </>
  );
}
