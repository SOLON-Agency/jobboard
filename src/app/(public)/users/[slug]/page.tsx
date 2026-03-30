import { notFound } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  Avatar,
  Divider,
  Button,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import DownloadIcon from "@mui/icons-material/Download";
import { createClient } from "@/lib/supabase/server";
import { experienceLevelLabels } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

interface MetaItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const MetaItem = ({ label, value, icon }: MetaItemProps) => (
  <Box>
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
      {icon && (
        <Box sx={{ display: "flex", color: "text.disabled", "& svg": { fontSize: 13 } }}>
          {icon}
        </Box>
      )}
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ fontWeight: 600, letterSpacing: 0.4 }}
      >
        {label}
      </Typography>
    </Stack>
    <Typography variant="body2" fontWeight={700} color="text.primary">
      {value}
    </Typography>
  </Box>
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, headline, is_public")
    .eq("slug", slug)
    .single();

  if (!data?.is_public) return { title: "Profil privat" };

  return {
    title: data.full_name ?? "Profil utilizator",
    description: data.headline ?? undefined,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !profile || !profile.is_public) {
    notFound();
  }

  const experienceLabel = profile.experience_level
    ? (experienceLevelLabels[profile.experience_level as keyof typeof experienceLevelLabels] ?? profile.experience_level)
    : null;

  const hasMeta = profile.location || experienceLabel || profile.headline;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 280px" },
          gap: { xs: 4, lg: 5 },
          alignItems: "start",
        }}
      >
        {/* ── LEFT: main content ── */}
        <Stack spacing={3}>
          {/* Overview */}
          {profile.bio && (
            <Paper
              variant="outlined"
              sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                Prezentare generală
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.85, whiteSpace: "pre-wrap" }}
              >
                {profile.bio}
              </Typography>
            </Paper>
          )}

          {/* Headline fallback when no bio */}
          {!profile.bio && profile.headline && (
            <Paper
              variant="outlined"
              sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                Prezentare generală
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {profile.headline}
              </Typography>
            </Paper>
          )}

          {/* Empty state */}
          {!profile.bio && !profile.headline && (
            <Paper
              variant="outlined"
              sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                Prezentare generală
              </Typography>
              <Typography variant="body1" color="text.disabled">
                Acest utilizator nu a adăugat o descriere.
              </Typography>
            </Paper>
          )}
        </Stack>

        {/* ── RIGHT: sticky sidebar ── */}
        <Box sx={{ position: { lg: "sticky" }, top: 88 }}>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "rgba(62, 92, 118, 0.04)",
              borderColor: "divider",
            }}
          >
            {/* Avatar + name hero */}
            <Box
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <Avatar
                src={profile.avatar_url ?? undefined}
                sx={{
                  width: 88,
                  height: 88,
                  bgcolor: "background.paper",
                  border: "2px solid",
                  borderColor: "divider",
                  mb: 1.5,
                }}
              >
                <PersonIcon sx={{ fontSize: 44 }} />
              </Avatar>

              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                {profile.full_name ?? "Utilizator"}
              </Typography>

              {profile.headline && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, px: 1 }}
                >
                  {profile.headline}
                </Typography>
              )}
            </Box>

            {hasMeta && (
              <>
                <Divider />
                <Stack spacing={2.5} sx={{ p: 3 }}>
                  {profile.location && (
                    <MetaItem
                      icon={<LocationOnOutlinedIcon />}
                      label="Locație"
                      value={profile.location}
                    />
                  )}
                  {experienceLabel && (
                    <MetaItem
                      icon={<WorkOutlineIcon />}
                      label="Experiență"
                      value={experienceLabel}
                    />
                  )}
                </Stack>
              </>
            )}

            {profile.cv_url && (
              <>
                <Divider />
                <Box sx={{ p: 3 }}>
                  <Button
                    component="a"
                    href={profile.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<DownloadIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Descarcă CV
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}
