import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Container, CircularProgress, Box } from "@mui/material";

export default function LoginPage() {
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
      <LoginForm />
      <br />
      <br />
      <br />
      <br />
    </Suspense>
  );
}
