import { Container, Box } from "@mui/material";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { EmailVerificationBanner } from "@/components/dashboard/EmailVerificationBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <EmailVerificationBanner />
      {/* On desktop, 2-col grid; on mobile, stacked single col */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "240px 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <DashboardNav />
        <Box>{children}</Box>
      </Box>
    </Container>
  );
}
