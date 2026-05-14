"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { newsletterSchema, type NewsletterFormData } from "@/components/forms/validations/newsletter.schema";
import { subscribeToNewsletter } from "@/app/newsletter/actions";
import { useToast } from "@/contexts/ToastContext";

interface NewsletterSignupProps {
  source?: string;
}

export function NewsletterSignup({ source = "homepage" }: NewsletterSignupProps) {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "", source },
  });

  const onSubmit = async (data: NewsletterFormData) => {
    const result = await subscribeToNewsletter({ email: data.email, source });
    if (result.status === "subscribed" || result.status === "already") {
      showToast("Te-ai abonat cu succes! Vei primi fiecare articol nou pe email.", "success");
      reset();
    } else {
      showToast(result.message ?? "A apărut o eroare. Încearcă din nou.", "error", 5000);
    }
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{ width: "100%" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "flex-start" }}
      >
        <Box sx={{ flex: 1 }}>
          <TextField
            {...register("email")}
            type="email"
            autoComplete="email"
            required
            placeholder="nume@avocat.ro"
            fullWidth
            size="medium"
            error={!!errors.email}
            helperText={errors.email?.message}
            inputProps={{
              "aria-describedby": errors.email
                ? "newsletter-email-error"
                : "newsletter-hint",
              "aria-required": "true",
            }}
            sx={{ bgcolor: "background.paper", borderRadius: 1 }}
          />
          <Typography
            id="newsletter-hint"
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.75, display: "block" }}
          >
            Te poți dezabona oricând. Nu trimitem spam.
          </Typography>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
          sx={{ minHeight: 56, minWidth: 140, whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {isSubmitting ? "Se trimite…" : "Mă abonez"}
        </Button>
      </Stack>
    </Box>
  );
}
