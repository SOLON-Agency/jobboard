"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "Authentication failed. Please try again." : null
  );
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const { error: authError } = await signIn(data.email, data.password);
    if (authError) {
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
          Welcome back
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 4, textAlign: "center" }}
        >
          Sign in to your LegalJobs account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <SocialButtons />

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register("email")}
            label="Email"
            type="email"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{ mb: 2 }}
          />
          <TextField
            {...register("password")}
            label="Password"
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
            sx={{ py: 1.5 }}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          Don&apos;t have an account?{" "}
          <Typography
            component={Link}
            href="/register"
            variant="body2"
            sx={{ color: "primary.main", textDecoration: "none" }}
          >
            Create one
          </Typography>
        </Typography>
      </Paper>
    </Container>
  );
};
