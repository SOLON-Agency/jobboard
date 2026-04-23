"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Avatar,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Skeleton,
  FormControlLabel,
  Switch,
  CircularProgress,
  FormHelperText,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import PublicIcon from "@mui/icons-material/Public";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { LocationAutocomplete } from "@/components/common/LocationAutocomplete";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/components/forms/validations/profile.schema";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { experienceLevelLabels, truncate } from "@/lib/utils";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { AddEditEducation } from "@/components/forms/AddEditEducation";
import { AddEditExperience } from "@/components/forms/AddEditExperience";
import { EditSkills } from "@/components/profile/EditSkills";
import { getEducationItems, type EducationItem } from "@/services/education.service";
import { getExperienceItems, type ExperienceItem } from "@/services/experience.service";
import { getProfileSkills, type ProfileSkillWithName } from "@/services/skills.service";
import type { Tables } from "@/types/database";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import appSettings from "@/config/app.settings.json";

const allowEmailNotificationOptOut =
  appSettings.features.allowEmailNotificationOptOut === true;

export function ProfileClient() {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [skills, setSkills] = useState<ProfileSkillWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifFeedback, setNotifFeedback] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const [{ data }, eduData, expData, skillsData] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      getEducationItems(supabase, user.id).catch(() => [] as EducationItem[]),
      getExperienceItems(supabase, user.id).catch(() => [] as ExperienceItem[]),
      getProfileSkills(supabase, user.id).catch(() => [] as ProfileSkillWithName[]),
    ]);
    if (data) setProfile(data);
    setEducation(eduData);
    setExperience(expData);
    setSkills(skillsData);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const openEdit = () => {
    if (!profile) return;
    setMessage(null);
    reset({
      full_name: profile.full_name ?? "",
      email: user?.email ?? "",
      phone: profile.phone ?? "",
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      experience_level: profile.experience_level ?? "",
      is_public: profile.is_public ?? false,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setMessage(null);
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setMessage(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name || null,
        headline: data.headline || null,
        bio: data.bio || null,
        location: data.location || null,
        experience_level: data.experience_level || null,
        is_public: data.is_public,
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      await loadProfile();
      setMessage({ type: "success", text: "Profil actualizat cu succes." });
      void supabase.functions
        .invoke("send-email", { body: { event: "profile_updated" } })
        .catch((e: unknown) => console.warn("notify-updated failed:", e));
      setTimeout(closeDrawer, 900);
    }
  };

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!user || !e.target.files?.[0]) return;
      const file = e.target.files[0];
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });

      if (error) {
        setMessage({ type: "error", text: "Eroare la încărcarea avatarului." });
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
      await loadProfile();
      setMessage({ type: "success", text: "Avatar actualizat." });
    },
    [user, supabase, loadProfile]
  );

  const handleCvUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!user || !e.target.files?.[0]) return;
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "CV-ul trebuie să fie mai mic de 5MB." });
        return;
      }
      setCvUploading(true);
      setMessage(null);
      try {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("cvs").upload(path, file, { upsert: true });

        if (error) {
          setMessage({ type: "error", text: "Eroare la încărcarea CV-ului." });
          return;
        }

        const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(path);
        await supabase.from("profiles").update({ cv_url: urlData.publicUrl }).eq("id", user.id);
        await loadProfile();
        setMessage({ type: "success", text: "CV încărcat cu succes." });
      } finally {
        setCvUploading(false);
      }
    },
    [user, supabase, loadProfile]
  );
  
  const handleEmailNotificationsChange = async (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    if (!user || !profile) return;
    if (!allowEmailNotificationOptOut && !checked) return;

    setNotifSaving(true);
    setNotifFeedback(null);
    const { error } = await supabase
      .from("profiles")
      .update({ notifications_email: checked })
      .eq("id", user.id);

    if (error) {
      setNotifFeedback({
        severity: "error",
        message: error.message || "Nu s-a putut actualiza preferința.",
      });
    } else {
      await loadProfile();
      setNotifFeedback({
        severity: "success",
        message: checked
          ? "Vei primi notificări prin e-mail."
          : "Nu vei mai primi e-mailuri de notificare.",
      });
    }
    setNotifSaving(false);
  };

  const handleCvDownload = useCallback(async () => {
    if (!profile?.cv_url) return;
    const pathMatch = profile.cv_url.match(/\/storage\/v1\/object\/public\/cvs\/(.+)$/);
    if (!pathMatch) { window.open(profile.cv_url, "_blank"); return; }
    const { data } = await supabase.storage
      .from("cvs")
      .createSignedUrl(pathMatch[1], 300, { download: true });
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.click();
    }
  }, [profile, supabase]);

  const openViewProfile = () => {
    if (!profile) return;
    window.open(`/users/${profile.slug}`, "_blank");
  };

  return (
    <>
      <DashboardPageHeader
        title={<Typography variant="h3">Profil</Typography>}
        actions={
          <>
            {profile?.is_public && profile?.slug && (
              <Button variant="outlined" startIcon={<OpenInNewIcon />} onClick={openViewProfile} disabled={loading}>
                Vizualizează profilul
              </Button>
            )}
            <Button variant="contained" startIcon={<EditIcon />} onClick={openEdit} disabled={loading}>
              Editează profilul
            </Button>
          </>
        }
      />

      {loading ? (
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
            <Skeleton variant="circular" width={80} height={80} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="60%" />
            </Box>
          </Stack>
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
        </Paper>
      ) : profile ? (
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={3} alignItems="flex-start">
            <Box sx={{ position: "relative" }}>
              <Avatar src={profile.avatar_url ?? undefined} sx={{ width: 80, height: 80 }}>
                <PersonIcon />
              </Avatar>
              <IconButton
                component="label"
                size="small"
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                }}
                title="Schimbă avatarul"
              >
                <EditIcon fontSize="inherit" />
                <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={700}>
                {profile.full_name ?? user?.email ?? "Necunoscut"} 
                {profile.experience_level && (
                  <Chip
                    size="small"
                    label={experienceLevelLabels[profile.experience_level as keyof typeof experienceLevelLabels] ?? profile.experience_level}
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
                {profile.is_public && profile.slug ? (
                  <Chip
                    icon={<PublicIcon />}
                    size="small"
                    label="Profil public"
                    color="success"
                    variant="outlined"
                    component={Link}
                    href={`/users/${profile.slug}`}
                    target="_blank"
                    clickable
                    sx={{ ml: 1 }}
                  />
                ) : (
                  <Chip
                    icon={<PublicIcon />}
                    size="small"
                    label="Profil privat"
                    variant="outlined"
                    sx={{ color: "text.disabled", borderColor: "divider", ml: 1 }}
                  />
                )}
              </Typography>
              {profile.headline && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {profile.headline}
                </Typography>
              )}
              {profile.location && <Stack direction="row" spacing={0.5}>
                <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {profile.location}
                </Typography>
              </Stack>}
            </Box>
          </Stack>

          {profile.bio && (
            <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {truncate(profile.bio ?? "")}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              CV / Curriculum Vitae
            </Typography>
            {profile.cv_url ? (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleCvDownload}
                >
                  Descarcă CV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  disabled={cvUploading}
                  startIcon={cvUploading ? <CircularProgress size={14} color="inherit" /> : undefined}
                  aria-busy={cvUploading}
                >
                  {cvUploading ? "Se încarcă…" : "Înlocuiește"}
                  <input type="file" hidden accept=".pdf" onChange={handleCvUpload} disabled={cvUploading} />
                </Button>
              </Stack>
            ) : (
              <Button
                variant="outlined"
                size="small"
                component="label"
                disabled={cvUploading}
                startIcon={cvUploading ? <CircularProgress size={14} color="inherit" /> : undefined}
                aria-busy={cvUploading}
              >
                {cvUploading ? "Se încarcă…" : "Încarcă CV (PDF, max 5MB)"}
                <input type="file" hidden accept=".pdf" onChange={handleCvUpload} disabled={cvUploading} />
              </Button>
            )}
          </Box>
        </Paper>
      ) : null}

      {!loading && profile ? (
        <Paper
          component="section"
          aria-labelledby="profile-notifications-heading"
          sx={{ mt: 3, p: 3, border: "1px solid", borderColor: "divider" }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <NotificationsActiveOutlinedIcon color="primary" aria-hidden />
            <Typography id="profile-notifications-heading" component="h2" variant="h6" fontWeight={700}>
              Notificări
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Controlează cum îți trimitem actualizări despre candidaturi și cont. Respectăm preferințele tale
            la trimiterea e-mailurilor tranzacționale.
          </Typography>

          {notifFeedback ? (
            <Alert
              severity={notifFeedback.severity}
              role="status"
              onClose={() => setNotifFeedback(null)}
              sx={{ mb: 2 }}
            >
              {notifFeedback.message}
            </Alert>
          ) : null}

          <FormControlLabel
            control={
              <Switch
                checked={profile.notifications_email !== false}
                onChange={handleEmailNotificationsChange}
                disabled={
                  notifSaving ||
                  (!allowEmailNotificationOptOut && profile.notifications_email !== false)
                }
                inputProps={{
                  "aria-describedby": "profile-email-notif-hint",
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Notificări prin e-mail
                </Typography>
                <Typography variant="caption" color="text.secondary" component="span" display="block">
                  Candidaturi, confirmări și mesaje legate de contul tău.
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start", mx: 0, gap: 1, mb: 1 }}
          />
          <FormHelperText id="profile-email-notif-hint" sx={{ mx: 0, maxWidth: 560 }}>
            {allowEmailNotificationOptOut
              ? "Dacă oprești e-mailurile, nu vei mai primi aceste notificări. Poți reactiva oricând."
              : "E-mailurile sunt activate implicit. Dezactivarea va fi disponibilă când vom oferi și alte canale (ex. SMS), ca să nu ratezi informații importante."}
          </FormHelperText>

          <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={profile.notifications_sms === true}
                  disabled
                  inputProps={{ "aria-disabled": true }}
                />
              }
              label={
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                  <SmsOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} aria-hidden />
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="text.disabled">
                      Notificări SMS
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="span" display="block">
                      În curând — nu există încă alte opțiuni de notificare.
                    </Typography>
                  </Box>
                </Stack>
              }
              sx={{ alignItems: "flex-start", mx: 0, gap: 1 }}
            />
          </Box>
        </Paper>
      ) : null}

      <Box sx={{ mt: 3 }}>
        <EditSkills
          initialItems={skills}
          loading={loading}
          onReload={loadProfile}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <AddEditExperience
          initialItems={experience}
          loading={loading}
          onReload={loadProfile}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <AddEditEducation
          initialItems={education}
          loading={loading}
          onReload={loadProfile}
        />
      </Box>

      <EditSideDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title="Editează profilul"
        message={message}
        onMessageClose={() => setMessage(null)}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2.5}>
            <TextField
              {...register("email")}
              label="Adresă email"
              fullWidth
              disabled={true}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              {...register("full_name")}
              label="Nume complet"
              fullWidth
              required
              error={!!errors.full_name}
              helperText={errors.full_name?.message}
            />
            <TextField
              {...register("headline")}
              label="Titlu profesional"
              fullWidth
              placeholder="ex. Consilier juridic senior"
              error={!!errors.headline}
              helperText={errors.headline?.message}
            />
            <TextField
              {...register("bio")}
              label="Biografie"
              fullWidth
              multiline
              rows={4}
              error={!!errors.bio}
              helperText={errors.bio?.message}
            />
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <LocationAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  onInputChange={field.onChange}
                  onBlur={field.onBlur}
                  fullWidth
                />
              )}
            />
            <Controller
              name="experience_level"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Nivel de experiență</InputLabel>
                  <Select {...field} label="Nivel de experiență" value={field.value ?? ""}>
                    {Object.entries(experienceLevelLabels).map(([val, label]) => (
                      <MenuItem key={val} value={val}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="is_public"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Profil public
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Permite oricui să îți vizualizeze profilul prin link direct.
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: "flex-start", mx: 0, gap: 1 }}
                />
              )}
            />
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ px: 4 }}>
                {isSubmitting ? "Se salvează..." : "Salvează profilul"}
              </Button>
              <Button variant="outlined" onClick={closeDrawer}>Anulează</Button>
            </Stack>
          </Stack>
        </Box>
      </EditSideDrawer>
    </>
  );
}
