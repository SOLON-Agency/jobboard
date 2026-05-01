"use client";

import { Box, Container, Typography } from "@mui/material";
import { BackgroundPaths } from "@/components/ui/background-paths";
import {
  RECRUITING_AGENCY_DESCRIPTION,
  RECRUITING_AGENCY_HIGHLIGHTS,
} from "@/components/marketing/recruitingAgencyConfig";

export { RECRUITING_AGENCY_HIGHLIGHTS, RECRUITING_AGENCY_DESCRIPTION } from "@/components/marketing/recruitingAgencyConfig";

export interface RecruitingAgenciesSectionProps {
  /** Section `id` for in-page links (e.g. `#agentii-recrutare`). */
  sectionId?: string;
  /** Matches `aria-labelledby` on the section and the inner title `id`. */
  sectionHeadingId?: string;
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export const RecruitingAgenciesSection = ({
  sectionId = "agentii-recrutare",
  sectionHeadingId = "agentii-recrutare-heading",
  title = "Agenții de recrutare",
  ctaLabel = "Postează un anunț gratuit",
  ctaHref = "/anunt",
}: RecruitingAgenciesSectionProps) => (
  <Box
    id={sectionId}
    component="section"
    aria-labelledby={sectionHeadingId}
    sx={{ bgcolor: "background.default", py: { xs: 6, md: 10 } }}
  >
    
    <Container maxWidth="lg">
      <Box
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid rgba(3, 23, 12, 0.1)",
          boxShadow: "0 8px 40px rgba(3, 23, 12, 0.06)",
        }}
      >
        <BackgroundPaths
          compact
          headingLevel="h2"
          sectionHeadingId={sectionHeadingId}
          overline={
            <Typography
              variant="overline"
              sx={{
                color: "primary.main",
                fontWeight: 700,
                letterSpacing: "0.2em",
                display: "block",
                mb: 1.5,
              }}
            >
              Pentru agențiile de recrutare
            </Typography>
          }
          title={title}
          description={RECRUITING_AGENCY_DESCRIPTION}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          highlights={RECRUITING_AGENCY_HIGHLIGHTS}
        />
      </Box>
    </Container>
  </Box>
);
