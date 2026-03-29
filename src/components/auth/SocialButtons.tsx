"use client";

import React from "react";
import { Button, Stack, Divider, Typography } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import type { Provider } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";

const providers: { id: Provider; label: string; icon: React.ReactNode }[] = [
  { id: "google", label: "Google", icon: <GoogleIcon /> },
  { id: "facebook", label: "Facebook", icon: <FacebookIcon /> },
  { id: "twitter", label: "X", icon: <XIcon /> },
];

export const SocialButtons: React.FC = () => {
  const { signInWithProvider } = useAuth();

  const handleSocial = async (provider: Provider) => {
    await signInWithProvider(provider);
  };

  return (
    <>
      <Stack spacing={1.5}>
        {providers.map((p) => (
          <Button
            key={p.id}
            variant="outlined"
            startIcon={p.icon}
            onClick={() => handleSocial(p.id)}
            fullWidth
            sx={{ py: 1.2, justifyContent: "flex-start", pl: 3 }}
          >
            Continue with {p.label}
          </Button>
        ))}
      </Stack>

      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          or
        </Typography>
      </Divider>
    </>
  );
};
