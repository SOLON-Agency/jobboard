import { notFound } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  Chip,
  Avatar,
  Divider,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LanguageIcon from "@mui/icons-material/Language";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import {
  getCompanyWithJobs,
  getAllCompanySlugs,
} from "@/services/companies.service";
import { generateOrganizationJsonLd } from "@/lib/seo";
import { CompanyJobList } from "@/components/companies/CompanyJobList";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  try {
    const { company } = await getCompanyWithJobs(supabase, slug);
    return {
      title: company.name,
      description:
        company.description?.slice(0, 160) ??
        `${company.name} company profile and job listings.`,
    };
  } catch {
    return { title: "Company Not Found" };
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider", mb: 4 }}>
          <Stack direction="row" spacing={3} alignItems="flex-start">
            <Avatar
              src={company.logo_url ?? undefined}
              sx={{
                width: 80,
                height: 80,
                bgcolor: "background.default",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <BusinessIcon sx={{ fontSize: 40, color: "text.secondary" }} />
            </Avatar>
            <Box>
              <Typography variant="h2" sx={{ mb: 1 }}>
                {company.name}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {company.location && (
                  <Chip
                    icon={<LocationOnOutlinedIcon />}
                    label={company.location}
                    size="small"
                    variant="outlined"
                  />
                )}
                {company.industry && (
                  <Chip label={company.industry} size="small" variant="outlined" />
                )}
                {company.size && (
                  <Chip
                    icon={<PeopleOutlineIcon />}
                    label={company.size}
                    size="small"
                    variant="outlined"
                  />
                )}
                {company.website && (
                  <Chip
                    icon={<LanguageIcon />}
                    label="Site web"
                    size="small"
                    variant="outlined"
                    component="a"
                    href={company.website}
                    target="_blank"
                    clickable
                  />
                )}
              </Stack>
            </Box>
          </Stack>

          {company.description && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {company.description}
              </Typography>
            </>
          )}
        </Paper>

        <Typography variant="h3" sx={{ mb: 3 }}>
          Posturi disponibile ({jobs.length})
        </Typography>

        <CompanyJobList jobs={jobs} />
      </Container>
    </>
  );
}
