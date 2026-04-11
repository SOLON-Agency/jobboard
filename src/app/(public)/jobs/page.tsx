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
      {/* <Typography variant="h2" sx={{ mb: 1 }}>
        Browse Jobs
      </Typography> */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
          gap: { xs: 2, md: 3 },
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            position: { md: "sticky" },
            top: { md: "calc(64px + 16px)" },
            maxHeight: { md: "calc(100vh - 64px - 32px)" },
            overflowY: { md: "auto" },
          }}
        >
          <Suspense fallback={<CircularProgress />}>
            <JobFilters />
          </Suspense>
        </Box>
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
