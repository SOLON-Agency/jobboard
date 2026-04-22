"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  CircularProgress,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/components/forms/validations/login.schema";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { useAuth } from "@/hooks/useAuth";
import appSettings from "@/config/app.settings.json";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "Autentificare eșuată. Te rugăm să încerci din nou." : null
  );
  const { user, signIn } = useAuth();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    const { error: authError } = await signIn(data.email, data.password);
    if (authError) {
      const code = (authError as { code?: string }).code;
      if (code === "email_not_confirmed" || authError.message === "Email not confirmed") {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }
      setError(authError.message);
    } else {
      router.push(redirect);
      router.refresh();
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        sx={{
          p: 4,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Typography variant="h3" sx={{ mb: 1, textAlign: "center" }}>
          Bine ai revenit
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 4, textAlign: "center" }}
        >
          Conectează-te la contul tău {appSettings.name}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* <SocialButtons /> */}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register("email")}
            label="E-mail"
            type="email"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{ mb: 2 }}
          />
          <TextField
            {...register("password")}
            label="Parolă"
            type="password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={18} color="inherit" /> : null
            }
            sx={{ py: 1.5 }}
          >
            {isSubmitting ? "Se conectează..." : "Conectare"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          Nu ai cont?{" "}
          <Typography
            component={Link}
            href="/register"
            variant="body2"
            sx={{ color: "primary.main", textDecoration: "none" }}
          >
            Creează unul
          </Typography>
        </Typography>
      </Paper>
    </Container>
  );
};
