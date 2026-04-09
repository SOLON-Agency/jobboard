"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Typography,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem as MuiMenuItem,
  Paper,
  Stack,
  Box,
  Avatar,
  Chip,
  IconButton,
  Skeleton,
  useMediaQuery,
  useTheme,
  Tooltip,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LanguageIcon from "@mui/icons-material/Language";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import appSettings from "@/config/app.settings.json";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getUserCompaniesWithJobCount,
  updateCompany,
  archiveCompany,
  type CompanyWithJobCount,
} from "@/services/companies.service";
import { slugify, parseSupabaseError } from "@/lib/utils";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import { AddEditCompany } from "@/components/dashboard/AddEditCompany";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import type { CompanyFormData } from "@/components/dashboard/AddEditCompany";

interface CompanyActionsProps {
  company: CompanyWithJobCount;
  onEdit: (c: CompanyWithJobCount) => void;
  onArchive: (c: CompanyWithJobCount) => void;
}

const CompanyActions: React.FC<CompanyActionsProps> = ({ company, onEdit, onArchive }) => {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const archiveAction = appSettings.features.archiveJobs ? {
    label: company.is_archived ? "Dezarhivează" : "Arhivează",
    icon: company.is_archived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />,
    color: "error" as const,
    onClick: () => onArchive(company),
  } : null;

  // On desktop show 2 buttons (Edit + Preview); on tablet/mobile show 1 (Edit)
  const visibleCount = isMd ? 2 : 1;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {/* Edit — primary, always first */}
      <Tooltip title={!isSm ? "Editează" : ""}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => onEdit(company)}
          startIcon={isSm ? <EditIcon fontSize="small" /> : undefined}
          sx={{ minWidth: 0, px: isSm ? 1.5 : 1, fontWeight: 600, boxShadow: "none", "&:hover": { boxShadow: "none" }, whiteSpace: "nowrap" }}
        >
          {isSm ? "Editează" : <EditIcon fontSize="small" />}
        </Button>
      </Tooltip>

      {/* Overflow menu — preview on tablet/mobile + archive */}
      <>
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
          <MuiMenuItem
            component={Link}
            href={`/companies/${company.slug}`}
            target="_blank"
            onClick={() => setMenuAnchor(null)}
            sx={{ gap: 1.5, py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 0, color: "secondary.main" }}>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Previzualizează"
              primaryTypographyProps={{ variant: "body2", color: "secondary.main", fontWeight: 500 }}
            />
          </MuiMenuItem>
          {/* Archive/Unarchive */}
          {archiveAction && (
            <>
              {visibleCount < 2 && <Divider />}
              <MuiMenuItem
                onClick={() => { archiveAction.onClick(); setMenuAnchor(null); }}
                sx={{ gap: 1.5, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: "error.main" }}>
                  {archiveAction.icon}
                </ListItemIcon>
                <ListItemText
                  primary={archiveAction.label}
                  primaryTypographyProps={{ variant: "body2", color: "error.main", fontWeight: 500 }}
                />
              </MuiMenuItem>
            </>
          )}
        </Menu>
      </>
    </Stack>
  );
};

export default function CompanyPage() {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [companies, setCompanies] = useState<CompanyWithJobCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyWithJobCount | null>(null);
  const [formDefaults, setFormDefaults] = useState<CompanyFormData | null>(null);
  const [initialLogoUrl, setInitialLogoUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getUserCompaniesWithJobCount(supabase, user.id, showArchived);
    setCompanies(data);
    setLoading(false);
  }, [user, supabase, showArchived]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setMessage(null);
    setInitialLogoUrl(null);
    setFormDefaults({ name: "", description: "", website: "", industry: "", size: "", location: "", founded_year: "" });
    setDrawerOpen(true);
  };

  const openEdit = (company: CompanyWithJobCount) => {
    setEditing(company);
    setMessage(null);
    setInitialLogoUrl(company.logo_url ?? null);
    setFormDefaults({
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
    setInitialLogoUrl(null);
    setFormDefaults(null);
  };

  const handleArchive = useCallback(
    async (company: CompanyWithJobCount) => {
      const next = !company.is_archived;
      const label = next ? "arhivezi" : "dezarhivezi";
      if (!confirm(`Ești sigur că vrei să ${label} compania „${company.name}"?`)) return;
      try {
        await archiveCompany(supabase, company.id, next);
        await load();
      } catch (err) {
        setMessage({ type: "error", text: String(err) });
      }
    },
    [supabase, load]
  );

  const uploadLogo = useCallback(
    async (companyId: string, file: File): Promise<string | null> => {
      const ext = file.name.split(".").pop();
      const path = `${companyId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("logos").getPublicUrl(path);
      return data.publicUrl;
    },
    [supabase]
  );

  const onSubmit = useCallback(
    async (data: CompanyFormData, logoFile: File | null) => {
      if (!user) return;
      setMessage(null);
      try {
        if (editing) {
          const logoUrl = logoFile ? await uploadLogo(editing.id, logoFile) : null;
          await updateCompany(supabase, editing.id, {
            name: data.name,
            slug: slugify(data.name),
            description: data.description || null,
            website: data.website || null,
            industry: data.industry || null,
            size: data.size || null,
            location: data.location || null,
            founded_year: data.founded_year ? Number(data.founded_year) : null,
            ...(logoUrl ? { logo_url: logoUrl } : {}),
          });
          setMessage({ type: "success", text: "Companie actualizată." });
        } else {
          const slug = slugify(data.name);
          const { data: newCompany } = await supabase
            .from("companies")
            .insert({
              name: data.name,
              slug,
              description: data.description || null,
              website: data.website || null,
              industry: data.industry || null,
              size: data.size || null,
              location: data.location || null,
              founded_year: data.founded_year ? Number(data.founded_year) : null,
              created_by: user.id,
            })
            .select("id")
            .single();

          if (!newCompany) throw new Error("Failed to create company");

          await supabase
            .from("company_users")
            .insert({ company_id: newCompany.id, user_id: user.id, role: "owner", accepted_at: new Date().toISOString() });

          if (logoFile) {
            const logoUrl = await uploadLogo(newCompany.id, logoFile);
            if (logoUrl) {
              await supabase
                .from("companies")
                .update({ logo_url: logoUrl })
                .eq("id", newCompany.id);
            }
          }

          setMessage({ type: "success", text: "Companie creată." });
          void fetch("/api/companies/notify-created", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ company_id: newCompany.id }),
          }).catch((e) => console.warn("notify-created failed:", e));
        }
        await load();
        setTimeout(closeDrawer, 900);
      } catch (err) {
        setMessage({ type: "error", text: parseSupabaseError(err) });
      }
    },
    [user, supabase, editing, load, uploadLogo]
  );

  if (loading) {
    return (
      <>
        <DashboardPageHeader
          title={<Skeleton variant="text" width={160} height={40} />}
          actions={<Skeleton variant="rounded" width={140} height={36} />}
        />
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 2 }} />
        ))}
      </>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title={<Typography variant="h3">Companii</Typography>}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Companie nouă
          </Button>
        }
      />

      {companies.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
          <BusinessIcon sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>
            Nicio companie
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Creează o companie pentru a publica locuri de muncă.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Creează companie
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
                  {company.is_archived && (
                    <Chip
                      label="Arhivată"
                      size="small"
                      color="default"
                      sx={{ fontSize: "0.65rem", height: 20 }}
                    />
                  )}
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
                        sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                      >
                        {company.website}
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
                  {company.jobCount}{" "}{company.jobCount === 1 ? isMobile ? "anunț" : "anunț de muncă" : isMobile ? "anunțuri" : "anunțuri de muncă"}
                </Typography>
              </Stack>

              <CompanyActions
                company={company}
                onEdit={openEdit}
                onArchive={handleArchive}
              />
            </Paper>
          ))}
        </Stack>
      )}

      <EditSideDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? `Editează: ${editing.name}` : "Creează companie"}
        message={message}
        onMessageClose={() => setMessage(null)}
      >
        {formDefaults && (
          <AddEditCompany
            key={editing?.id ?? "create"}
            editing={editing}
            defaultValues={formDefaults}
            initialLogoUrl={initialLogoUrl}
            onSubmit={onSubmit}
            onCancel={closeDrawer}
          />
        )}
      </EditSideDrawer>
    </>
  );
}
