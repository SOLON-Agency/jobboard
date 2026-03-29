import { Container, Typography, Paper, Box } from "@mui/material";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LegalJobs privacy policy and terms of service.",
};

export default function PolicyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h2" sx={{ mb: 4 }}>
          Privacy Policy
        </Typography>

        <Box sx={{ "& h4": { mt: 4, mb: 1.5 }, "& p": { mb: 2 } }}>
          <Typography variant="h4">1. Information We Collect</Typography>
          <Typography color="text.secondary">
            We collect information you provide directly to us, including your
            name, email address, CV, and any other information you choose to
            provide when creating an account or applying for jobs.
          </Typography>

          <Typography variant="h4">2. How We Use Your Information</Typography>
          <Typography color="text.secondary">
            We use the information we collect to provide, maintain, and improve
            our services, to process job applications, and to communicate with
            you about opportunities that match your preferences.
          </Typography>

          <Typography variant="h4">3. Information Sharing</Typography>
          <Typography color="text.secondary">
            We share your application information only with the companies you
            apply to. We do not sell your personal information to third parties.
          </Typography>

          <Typography variant="h4">4. Data Security</Typography>
          <Typography color="text.secondary">
            We implement appropriate technical and organizational measures to
            protect your personal data against unauthorized access, alteration,
            disclosure, or destruction.
          </Typography>

          <Typography variant="h4">5. Your Rights</Typography>
          <Typography color="text.secondary">
            You have the right to access, correct, or delete your personal data
            at any time through your account settings. You may also contact us
            to exercise these rights.
          </Typography>

          <Typography variant="h4">6. Contact Us</Typography>
          <Typography color="text.secondary">
            If you have questions about this privacy policy, please contact us
            through the platform messaging system.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
