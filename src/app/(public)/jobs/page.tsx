import { Suspense } from "react";
import { Container, Box, Typography, CircularProgress } from "@mui/material";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobList } from "@/components/jobs/JobList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Jobs",
  description:
    "Search and filter legal job opportunities from top law firms.",
};

export default function JobsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>
        Browse Jobs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Discover your next legal career opportunity
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Suspense fallback={<CircularProgress />}>
          <JobFilters />
        </Suspense>
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          }
        >
          <JobList />
        </Suspense>
      </Box>
    </Container>
  );
}
