import React from "react";
import { notFound } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  Chip,
  Divider,
  Button,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import InboxIcon from "@mui/icons-material/Inbox";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import {
  getCompanyWithJobs,
  getAllCompanySlugs,
} from "@/services/companies.service";
import { generateOrganizationJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JobsCarousel } from "@/components/jobs/JobsCarousel";
import { CompanyDescription } from "@/components/companies/CompanyDescription";
import { CompanyPageTracker } from "@/components/companies/CompanyPageTracker";
import { CompanyFavouriteButton } from "@/components/companies/CompanyFavouriteButton";
import { CompanyLogoAvatar } from "@/components/company/CompanyLogoAvatar";
import { jobTypeLabels, jobTypeChipSx, experienceLevelLabels } from "@/lib/utils";
import type { Tables } from "@/types/database";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

// ── Small helper: two-line meta cell ────────────────────────────────────────

const MetaCell = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.25 }}>
      {icon}
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

// ── Derived job-type / experience chips from published jobs ──────────────────

function deriveJobChips(jobs: Tables<"job_listings">[]): Array<{ label: string; sx?: Record<string, string> }> {
  const chips: Array<{ label: string; sx?: Record<string, string> }> = [];
  const seenTypes = new Set<string>();
  const seenLevels = new Set<string>();
  let hasRemote = false;

  for (const job of jobs) {
    if (job.job_type && !seenTypes.has(job.job_type)) {
      seenTypes.add(job.job_type);
      chips.push({ label: jobTypeLabels[job.job_type] ?? job.job_type, sx: jobTypeChipSx[job.job_type] });
    }
    if (job.is_remote) hasRemote = true;
    for (const lvl of job.experience_level ?? []) {
      if (!seenLevels.has(lvl)) {
        seenLevels.add(lvl);
        chips.push({ label: experienceLevelLabels[lvl] ?? lvl });
      }
    }
  }
  if (hasRemote) chips.push({ label: "Remote" });
  return chips;
}

export async function generateStaticParams() {
  try {
    const supabase = createStaticClient();
    const slugs = await getAllCompanySlugs(supabase);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  try {
    const { company } = await getCompanyWithJobs(supabase, slug);
    const title = company.name;
    const description =
      company.description?.slice(0, 160) ??
      `${company.name} — profilul companiei și anunțuri de angajare.`;
    const url = `${SITE_URL}/companies/${slug}`;
    return {
      title,
      description,
      alternates: { canonical: `/companies/${slug}` },
      openGraph: { title, description, url, type: "website" },
      twitter: { card: "summary_large_image", title, description },
      robots: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
      },
    };
  } catch {
    return { title: "Companie negăsită" };
  }
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  let company, jobs, totalJobCount: number;
  try {
    const result = await getCompanyWithJobs(supabase, slug);
    company = result.company;
    jobs = result.jobs;
    totalJobCount = result.totalJobCount;
  } catch {
    notFound();
  }

  const jsonLd = generateOrganizationJsonLd(company);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Acasă", url: SITE_URL },
    { name: "Companii", url: `${SITE_URL}/companies` },
    { name: company.name, url: `${SITE_URL}/companies/${company.slug}` },
  ]);
  const jobChips = deriveJobChips(jobs);

  return (
    <>
      <CompanyPageTracker companyId={company.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
          {company.location && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {company.location}
              </Typography>
            </Stack>
          )}
          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ ml: 1 }}>
            {totalJobCount}{" "}
            {totalJobCount === 1 ? "anunț total" : "anunțuri totale"}
          </Typography>
          <Typography variant="body2" color="success.main" fontWeight={600}>
            {jobs.length}{" "}
            {jobs.length === 1 ? "disponibil" : "disponibile"}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 300px" },
            gap: { xs: 3, lg: 5 },
            alignItems: "start",
          }}
        >
          {/* ── LEFT: title + description ──────────────────────────────────── */}
          <Box>
            {/* Title row */}
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              gap={2}
              sx={{ mb: 3 }}
            >
              <Typography variant="h1" fontWeight={800} sx={{ lineHeight: 1.15 }}>
                {company.name}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ flexShrink: 0, pt: 0.5 }}>
                {/* Favourite */}
                <CompanyFavouriteButton
                  companyId={company.id}
                  companyName={company.name}
                />

                {/* Share — always visible */}
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

                {/* Website */}
                {company.website && (
                  <>
                    <Button
                      component="a"
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      size="medium"
                      endIcon={<OpenInNewIcon sx={{ fontSize: "16px !important" }} />}
                      sx={{
                        borderRadius: 5,
                        fontWeight: 700,
                        bgcolor: "text.primary",
                        color: "background.paper",
                        "&:hover": { bgcolor: "text.secondary" },
                        display: { xs: "none", sm: "inline-flex" },
                      }}
                    >
                      <Typography sx={{ display: { sm: "none", md: "inline-flex" } }}>Vizitează website</Typography>
                      <Typography sx={{ display: { xs: "inline-flex", md: "none" } }}>Website</Typography>
                    </Button>
                    <Tooltip title="Vizitează website">
                      <Button
                        component="a"
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
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
                        <OpenInNewIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Stack>
            </Stack>

            {/* Description card */}
            {company.description && (
              <Paper
                sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, border: "1px solid rgba(3, 23, 12, 0.1)" }}
              >
                <CompanyDescription
                  description={company.description}
                  companyId={company.id}
                />
              </Paper>
            )}
          </Box>

          {/* ── RIGHT: sticky sidebar ─────────────────────────────────────── */}
          <Box sx={{ position: { sm: "sticky" }, top: { sm: 88 } }}>
            <Paper
              sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid rgba(3, 23, 12, 0.1)" }}
            >
              {/* Logo + name hero */}
              <Box
                sx={{
                  bgcolor: "action.hover",
                  py: 3,
                  px: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.5,
                  textAlign: "center",
                }}
              >
                <CompanyLogoAvatar
                  logoUrl={company.logo_url}
                  alt={company.name}
                  variant="rounded"
                  size={72}
                  sx={{ borderRadius: 0 }}
                  fallback={<BusinessIcon sx={{ fontSize: 36, color: "text.secondary" }} />}
                />
                <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                  {company.name}
                </Typography>
              </Box>

              <Box sx={{ p: 2.5 }}>
                {/* 2-column meta grid */}
                {(company.location || company.industry || company.size || company.founded_year) && (
                  <>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                        mb: 2.5,
                      }}
                    >
                      {company.location && (
                        <MetaCell
                          label="Locație"
                          value={company.location}
                          icon={<LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />}
                        />
                      )}
                      {company.industry && (
                        <MetaCell
                          label="Industrie"
                          value={company.industry}
                          icon={<CategoryOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />}
                        />
                      )}
                      {company.size && (
                        <MetaCell
                          label="Dimensiune"
                          value={company.size}
                          icon={<PeopleOutlineIcon sx={{ fontSize: 14, color: "text.disabled" }} />}
                        />
                      )}
                      {company.founded_year && (
                        <MetaCell
                          label="Fondată în"
                          value={String(company.founded_year)}
                          icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />}
                        />
                      )}
                    </Box>
                  </>
                )}

                {/* Job type + experience chips */}
                {jobChips.length > 0 && (
                  <>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ fontWeight: 600, letterSpacing: 0.4, display: "block", mb: 1 }}
                    >
                      Tipuri de anunțuri
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
                      {jobChips.map((chip) => (
                        <Chip
                          key={chip.label}
                          label={chip.label}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 22,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            ...(chip.sx ?? {}),
                          }}
                        />
                      ))}
                    </Stack>
                  </>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* ── Jobs carousel ──────────────────────────────────────────────────── */}
        {jobs.length > 0 ? (
          <JobsCarousel
            title={`Posturi disponibile la ${company.name}`}
            jobs={jobs.map((job) => ({ ...job, companies: company }))}
          />
        ) : (
          <Box
            sx={{
              mt: 4,
              py: 6,
              textAlign: "center",
              border: "1px dashed rgba(3, 23, 12, 0.1)",
              borderRadius: 2,
            }}
          >
            <InboxIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" color="text.disabled">
              Momentan nu există posturi disponibile la această companie.
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
}
