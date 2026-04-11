import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Box, CircularProgress, Container } from "@mui/material";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        </Container>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
