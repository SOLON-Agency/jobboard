"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/components/forms/validations/register.schema";
import { useAuth } from "@/hooks/useAuth";
import appSettings from "@/config/app.settings.json";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { user, signUp } = useAuth();

  // ?email= pre-fills the email field (e.g. when coming from the claim flow)
  const prefillEmail = searchParams.get("email") ?? "";
  // ?redirect= is where to send the user after successful registration
  const redirectAfter = searchParams.get("redirect") ?? "/dashboard";

  useEffect(() => {
    if (user) router.replace(redirectAfter);
  }, [user, router, redirectAfter]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: prefillEmail, fullName: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    const { data: authData, error: authError } = await signUp(data.email, data.password);
    if (authError) {
      setError(authError.message);
      return;
    }

    // When email confirmation is required, Supabase returns a user but no
    // session, and user_metadata.email_verified is false (or absent).
    const emailVerified =
      authData?.user?.user_metadata?.email_verified === true ||
      authData?.user?.email_confirmed_at != null;

    if (!emailVerified) {
      // Preserve the redirect param so that after verification they go to the claim page
      const verifyQuery = redirectAfter && redirectAfter !== "/dashboard"
        ? `?email=${encodeURIComponent(data.email)}&redirect=${encodeURIComponent(redirectAfter)}`
        : `?email=${encodeURIComponent(data.email)}`;
      router.push(`/verify-email${verifyQuery}`);
      return;
    }

    router.push(redirectAfter);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        sx={{
          p: 4,
          border: "1px solid rgba(3, 23, 12, 0.1)",
          borderRadius: 3,
        }}
      >
        <Typography variant="h3" component="h1" sx={{ mb: 3, textAlign: "center" }}>
          Creează cont {appSettings.name}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* <SocialButtons /> */}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register("fullName")}
            label="Nume complet"
            fullWidth
            required
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            inputProps={{ "aria-required": "true" }}
            sx={{ mb: 2 }}
          />
          <TextField
            {...register("email")}
            label="E-mail"
            type="email"
            fullWidth
            required
            error={!!errors.email}
            helperText={errors.email?.message}
            inputProps={{ "aria-required": "true" }}
            sx={{ mb: 2 }}
          />
          <TextField
            {...register("password")}
            label="Parolă"
            type="password"
            fullWidth
            required
            error={!!errors.password}
            helperText={errors.password?.message}
            inputProps={{ "aria-required": "true" }}
            sx={{ mb: 2 }}
          />
          <TextField
            {...register("confirmPassword")}
            label="Confirmă parola"
            type="password"
            fullWidth
            required
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            inputProps={{ "aria-required": "true" }}
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
            {isSubmitting ? "Se creează contul..." : "Creează cont"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          Ai deja un cont?{" "}
          <Typography
            component={Link}
            href="/login"
            variant="body2"
            sx={{ color: "primary.main", textDecoration: "none" }}
          >
            Conectează-te
          </Typography>
        </Typography>
      </Paper>
    </Container>
  );
};
