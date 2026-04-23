import { notFound } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  Avatar,
  Chip,
  Divider,
  Button,
  Tooltip,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import DownloadIcon from "@mui/icons-material/Download";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import { createClient } from "@/lib/supabase/server";
import { experienceLevelLabels } from "@/lib/utils";
import { getPublicEducationItems } from "@/services/education.service";
import { getPublicExperienceItems } from "@/services/experience.service";
import { getProfileSkills, type ProfileSkillWithName } from "@/services/skills.service";
import { generatePersonJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { EducationTimeline } from "@/components/profile/EducationTimeline";
import { ExperienceTimeline } from "@/components/profile/ExperienceTimeline";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

// ── Two-line meta cell (mirrors company page MetaCell) ───────────────────────

const MetaCell = ({ label, value, icon = null }: { label: string; value: string; icon?: React.ReactNode }) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={0.5}>
      {icon && icon}
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ fontWeight: 600, letterSpacing: 0.4, display: "block", mb: 0.25 }}
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

  if (!data?.is_public) {
    return {
      title: "Profil privat",
      robots: { index: false, follow: false },
    };
  }

  const title = data.full_name ?? "Profil utilizator";
  const description = data.headline ?? undefined;
  const url = `${SITE_URL}/users/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/users/${slug}` },
    openGraph: { title, description, url, type: "profile" },
    twitter: { card: "summary", title, description },
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
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

  const [education, experience, skills] = await Promise.all([
    getPublicEducationItems(supabase, profile.id).catch(() => []),
    getPublicExperienceItems(supabase, profile.id).catch(() => []),
    getProfileSkills(supabase, profile.id).catch(() => [] as ProfileSkillWithName[]),
  ]);

  // Build a signed download URL so browsers trigger Save-As instead of opening inline.
  // The public URL format is: .../storage/v1/object/public/cvs/<path>
  let cvDownloadUrl: string | null = profile.cv_url;
  if (profile.cv_url) {
    const pathMatch = profile.cv_url.match(/\/storage\/v1\/object\/public\/cvs\/(.+)$/);
    if (pathMatch) {
      const { data } = await supabase.storage
        .from("cvs")
        .createSignedUrl(pathMatch[1], 300, { download: true });
      if (data?.signedUrl) cvDownloadUrl = data.signedUrl;
    }
  }

  const experienceLabel = profile.experience_level
    ? (experienceLevelLabels[
        profile.experience_level as keyof typeof experienceLevelLabels
      ] ?? profile.experience_level)
    : null;

  const hasMetaGrid = !!(profile.location || experienceLabel);

  const personJsonLd = generatePersonJsonLd(
    {
      slug: profile.slug,
      full_name: profile.full_name,
      headline: profile.headline,
      avatar_url: profile.avatar_url,
    },
    skills.map((s) => ({ name: s.skill.name }))
  );
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Acasă", url: SITE_URL },
    { name: profile.full_name ?? "Profil", url: `${SITE_URL}/users/${profile.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        divider={
          <Box
            component="span"
            sx={{ width: "1px", height: 14, bgcolor: "divider", display: "inline-block" }}
          />
        }
        sx={{ mb: 2 }}
      >
        {profile.location && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {profile.location}
            </Typography>
          </Stack>
        )}
        {experienceLabel && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <LabelOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {experienceLabel}
            </Typography>
          </Stack>
        )}
        {skills.length > 0 && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <WorkOutlineIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {skills.length} {skills.length === 1 ? "competență" : "competențe"}
            </Typography>
          </Stack>
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 300px" },
          gap: { xs: 3, lg: 5 },
          alignItems: "start",
        }}
      >
        {/* ── LEFT: title + content ─────────────────────────────────────────── */}
        <Box>
          {/* Title row */}
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            gap={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h1" fontWeight={800} sx={{ lineHeight: 1.15 }}>
                {profile.full_name ?? "Utilizator"}
              </Typography>
              {profile.headline && (
                <Typography variant="h6" component="p" color="text.secondary" fontWeight={400} sx={{ mt: 0.5 }}>
                  {profile.headline}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexShrink: 0, pt: 1.5 }}>
              {/* Share */}
              <Button
                variant="outlined"
                size="medium"
                startIcon={<ShareOutlinedIcon sx={{ fontSize: "16px !important" }} />}
                sx={{
                  borderRadius: 5,
                  fontWeight: 700,
                  display: { xs: "none", md: "inline-flex" },
                }}
              >
                Trimite
              </Button>
              <Tooltip title="Trimite">
                <Button
                  variant="outlined"
                  size="medium"
                  sx={{
                    borderRadius: 5,
                    minWidth: 0,
                    px: 1.5,
                    display: { xs: "inline-flex", md: "none" },
                  }}
                >
                  <ShareOutlinedIcon fontSize="small" />
                </Button>
              </Tooltip>

              {/* CV download */}
              {cvDownloadUrl && (
                <>
                  <Button
                    component="a"
                    href={cvDownloadUrl}
                    download
                    variant="contained"
                    size="medium"
                    endIcon={<DownloadIcon sx={{ fontSize: "16px !important" }} />}
                    sx={{
                      borderRadius: 5,
                      fontWeight: 700,
                      bgcolor: "text.primary",
                      color: "background.paper",
                      "&:hover": { bgcolor: "text.secondary" },
                      display: { xs: "none", sm: "inline-flex" },
                    }}
                  >
                    Descarcă CV
                  </Button>
                  <Tooltip title="Descarcă CV">
                    <Button
                      component="a"
                      href={cvDownloadUrl}
                      download
                      variant="contained"
                      size="medium"
                      sx={{
                        borderRadius: 5,
                        minWidth: 0,
                        px: 1.5,
                        bgcolor: "text.primary",
                        color: "background.paper",
                        "&:hover": { bgcolor: "text.secondary" },
                        display: { xs: "inline-flex", sm: "none" },
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </Button>
                  </Tooltip>
                </>
              )}
            </Stack>
          </Stack>

          {/* Bio / overview card */}
          <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, mb: 3, border: "1px solid rgba(3, 23, 12, 0.1)" }}>

            {profile.bio ? (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.85, whiteSpace: "pre-wrap", pl: 5 }}
              >
                {profile.bio}
              </Typography>
            ) : profile.headline ? (
              <Typography variant="body1" color="text.secondary" sx={{ pl: 5 }}>
                {profile.headline}
              </Typography>
            ) : (
              <Typography variant="body1" color="text.disabled" sx={{ pl: 5 }}>
                Acest utilizator nu a adăugat o descriere.
              </Typography>
            )}
          </Paper>

          {/* Experience */}
          {experience.length > 0 && <Box sx={{ mb: 3 }}><ExperienceTimeline items={experience} /></Box>}

          {/* Education */}
          {education.length > 0 && <EducationTimeline items={education} />}
        </Box>

        {/* ── RIGHT: sticky sidebar ─────────────────────────────────────────── */}
        <Box sx={{ position: { sm: "sticky" }, top: { sm: 88 } }}>
          <Paper sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid rgba(3, 23, 12, 0.1)" }}>

            {/* Avatar + name hero */}
            <Box
              sx={{
                bgcolor: "action.hover",
                py: 3,
                px: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                textAlign: "center",
              }}
            >
              <Avatar
                src={profile.avatar_url ?? undefined}
                alt={profile.full_name ?? ""}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "background.default",
                  border: "2px solid rgba(3, 23, 12, 0.1)",
                }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                {profile.full_name ?? "Utilizator"}
              </Typography>
              {profile.headline && (
                <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                  {profile.headline}
                </Typography>
              )}
            </Box>

            {/* Meta grid */}
            {hasMetaGrid && (
              <>
                <Divider />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                    p: 2.5,
                  }}
                >
                  {profile.location && (
                    <MetaCell label="Locație" value={profile.location} icon={<LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />} />
                  )}
                  {experienceLabel && (
                    <MetaCell label="Experiență" value={experienceLabel} icon={<LabelOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />} />
                  )}
                </Box>
              </>
            )}

            {/* Skills chips */}
            {skills.length > 0 && (
              <>
                <Divider />
                <Box sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                    <WorkOutlineIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ fontWeight: 600, letterSpacing: 0.4 }}
                    >
                      Competențe
                    </Typography>
                  </Stack>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {skills.map((s) => (
                      <Chip
                        key={s.id}
                        label={s.skill.name}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                      />
                    ))}
                  </Stack>
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
    </>
  );
}
