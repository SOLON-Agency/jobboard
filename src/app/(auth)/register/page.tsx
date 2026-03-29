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
    fullName: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere"),
    email: z.string().email("Introduceți o adresă de e-mail validă"),
    password: z.string().min(6, "Parola trebuie să aibă cel puțin 6 caractere"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parolele nu corespund",
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
            Verifică-ți e-mailul
          </Typography>
          <Typography color="text.secondary">
            Am trimis un link de confirmare la adresa ta de e-mail. Apasă pe link pentru a-ți activa contul.
          </Typography>
          <Button
            component={Link}
            href="/login"
            variant="outlined"
            sx={{ mt: 3 }}
          >
            Înapoi la conectare
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
          Creează-ți contul
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 4, textAlign: "center" }}
        >
          Începe-ți călătoria în cariera juridică
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
            label="Nume complet"
            fullWidth
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            sx={{ mb: 2 }}
          />
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
            sx={{ mb: 2 }}
          />
          <TextField
            {...register("confirmPassword")}
            label="Confirmă parola"
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
}
