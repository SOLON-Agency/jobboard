import type { Metadata } from "next";
import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { requireAdminRole } from "@/lib/server-guards";
import { createClient } from "@/lib/supabase/server";
import { getUnclaimedCompanies } from "@/services/companies.service";
import { UnclaimedListClient } from "./UnclaimedListClient";

export const metadata: Metadata = {
  title: "Companii nerevendicate",
  robots: { index: false },
};

export default async function UnclaimedCompaniesPage() {
  await requireAdminRole();
  const supabase = await createClient();
  const companies = await getUnclaimedCompanies(supabase);

  return (
    <Container maxWidth="lg" disableGutters>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={{ xs: 2, md: 0 }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" component="h1" fontWeight={700}>
            Companii nerevendicate
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {companies.length === 0
              ? "Nicio companie nerevendicată momentan."
              : `${companies.length} compan${companies.length === 1 ? "ie" : "ii"} în așteptarea revendicării contului lor`}
          </Typography>
        </Box>
        <Link href="/dashboard/admin/unclaimed/new" style={{ textDecoration: "none" }}>
          <Button variant="contained" startIcon={<AddIcon />} size="small">
            Companie nouă
          </Button>
        </Link>
      </Stack>

      <UnclaimedListClient initialCompanies={companies} />
    </Container>
  );
}
