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
  IconButton,
  Tooltip,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import {
  getCompanyWithJobs,
  getAllCompanySlugs,
} from "@/services/companies.service";
import { generateOrganizationJsonLd } from "@/lib/seo";
import { JobsCarousel } from "@/components/jobs/JobsCarousel";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

interface MetaItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const MetaItem = ({ icon, label, value }: MetaItemProps) => (
  <Box>
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0 }}>
      <Box
        sx={{
          display: "flex",
          color: "text.disabled",
          "& svg": { fontSize: 13 },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ fontWeight: 600, letterSpacing: 0.4 }}
      >
        {label}
      </Typography>
    </Stack>
    <Typography
      variant="body2"
      fontWeight={700}
      color="text.primary"
      sx={{ pl: 0.25 }}
    >
      {value}
    </Typography>
  </Box>
);

export async function generateStaticParams() {
  try {
    const supabase = createStaticClient();
    const slugs = await getAllCompanySlugs(supabase);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  try {
    const { company } = await getCompanyWithJobs(supabase, slug);
    return {
      title: company.name,
      description:
        company.description?.slice(0, 160) ??
        `${company.name} — profilul companiei și anunțuri de angajare.`,
    };
  } catch {
    return { title: "Companie negăsită" };
  }
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  let company, jobs;
  try {
    const result = await getCompanyWithJobs(supabase, slug);
    company = result.company;
    jobs = result.jobs;
  } catch {
    notFound();
  }

  const jsonLd = generateOrganizationJsonLd(company);

  const hasMeta =
    company.location ||
    company.size ||
    company.industry ||
    company.founded_year;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" },
            gap: { xs: 4, lg: 6 },
            alignItems: "start",
          }}
        >
          {/* ── LEFT: main content ── */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: company.description ? 2 : 4 }}
            >
              <Typography variant="h2" fontWeight={800}>
                {company.name}
              </Typography>

              {company.website && (
                <>
                  <Button
                    component="a"
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    size="medium"
                    endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
                    sx={{
                      borderRadius: 2,
                      flexShrink: 0,
                      ml: 2,
                      display: { xs: "none", sm: "inline-flex" },
                    }}
                  >
                    Vizitează site-ul
                  </Button>
                  <Tooltip title="Vizitează site-ul">
                    <Button
                      component="a"
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      size="medium"
                      sx={{
                        flexShrink: 0,
                        ml: 1.5,
                        display: { xs: "inline-flex", sm: "none" },
                        border: "1px solid",
                        borderRadius: 10,
                      }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </Button>
                  </Tooltip>
                </>
              )}
            </Stack>

            {company.description && (
              <Typography
                color="text.secondary"
                sx={{ lineHeight: 1.85, fontSize: "1rem" }}
              >
                {company.description}
              </Typography>
            )}
          </Box>

          {/* ── RIGHT: sticky sidebar ── */}
          <Box sx={{ position: { lg: "sticky" }, top: 88 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "rgba(62, 92, 118, 0.04)",
                borderColor: "divider",
              }}
            >
              {/* Logo + company name */}
              <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                <Avatar
                  src={company.logo_url ?? undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 40, color: "text.secondary" }} />
                </Avatar>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  textAlign="center"
                  sx={{ lineHeight: 1.3 }}
                >
                  {company.name}
                </Typography>
              </Stack>

              {hasMeta && (
                <>
                  <Stack spacing={1}>
                    {company.location && (
                      <MetaItem
                        icon={<LocationOnOutlinedIcon />}
                        label="Locație"
                        value={company.location}
                      />
                    )}
                    {company.size && (
                      <MetaItem
                        icon={<PeopleOutlineIcon />}
                        label="Dimensiune"
                        value={company.size}
                      />
                    )}
                    {company.industry && (
                      <MetaItem
                        icon={<WorkOutlineIcon />}
                        label="Industrie"
                        value={company.industry}
                      />
                    )}
                    {company.founded_year && (
                      <MetaItem
                        icon={<CalendarTodayOutlinedIcon />}
                        label="Fondată în"
                        value={String(company.founded_year)}
                      />
                    )}
                  </Stack>
                </>
              )}

            </Paper>
          </Box>
        </Box>

        {jobs.length > 0 && (
          <>
            <JobsCarousel
              title="Posturi disponibile"
              jobs={jobs.map((job) => ({ ...job, companies: company }))}
            />
          </>
        )}
      </Container>
    </>
  );
}
