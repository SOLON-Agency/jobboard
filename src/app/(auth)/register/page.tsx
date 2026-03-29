"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const schema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const { error: authError } = await signUp(data.email, data.password);
    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Check your email
          </Typography>
          <Typography color="text.secondary">
            We sent a confirmation link to your email address. Click the link to
            activate your account.
          </Typography>
          <Button
            component={Link}
            href="/login"
            variant="outlined"
            sx={{ mt: 3 }}
          >
            Back to Sign In
          </Button>
        </Paper>
      </Container>
    );
  }

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
          Create your account
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 4, textAlign: "center" }}
        >
          Start your legal career journey
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <SocialButtons />

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register("fullName")}
            label="Full Name"
            fullWidth
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            sx={{ mb: 2 }}
          />
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
            sx={{ mb: 2 }}
          />
          <TextField
            {...register("confirmPassword")}
            label="Confirm Password"
            type="password"
            fullWidth
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
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
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          Already have an account?{" "}
          <Typography
            component={Link}
            href="/login"
            variant="body2"
            sx={{ color: "primary.main", textDecoration: "none" }}
          >
            Sign in
          </Typography>
        </Typography>
      </Paper>
    </Container>
  );
}
