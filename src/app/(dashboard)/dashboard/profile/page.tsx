"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Alert,
  Avatar,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { experienceLevelLabels } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  headline: z.string().max(120).optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  experience_level: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          reset({
            full_name: data.full_name ?? "",
            headline: data.headline ?? "",
            bio: data.bio ?? "",
            location: data.location ?? "",
            experience_level: data.experience_level ?? "",
          });
          setAvatarUrl(data.avatar_url);
        }
      });
  }, [user, supabase, reset]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setMessage(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name || null,
        headline: data.headline || null,
        bio: data.bio || null,
        location: data.location || null,
        experience_level: data.experience_level || null,
      })
      .eq("id", user.id);

    setMessage(
      error
        ? { type: "error", text: error.message }
        : { type: "success", text: "Profile updated successfully." }
    );
  };

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!user || !e.target.files?.[0]) return;
      const file = e.target.files[0];
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (error) {
        setMessage({ type: "error", text: "Failed to upload avatar." });
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
      setAvatarUrl(urlData.publicUrl);
      setMessage({ type: "success", text: "Avatar updated." });
    },
    [user, supabase]
  );

  const handleCvUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!user || !e.target.files?.[0]) return;
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "CV must be smaller than 5MB." });
        return;
      }
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("cvs")
        .upload(path, file, { upsert: true });

      if (error) {
        setMessage({ type: "error", text: "Failed to upload CV." });
        return;
      }

      const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(path);
      await supabase.from("profiles").update({ cv_url: urlData.publicUrl }).eq("id", user.id);
      setMessage({ type: "success", text: "CV uploaded successfully." });
    },
    [user, supabase]
  );

  return (
    <>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Edit Profile
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Avatar src={avatarUrl ?? undefined} sx={{ width: 80, height: 80 }} />
          <Box>
            <Button variant="outlined" component="label" size="small">
              Upload Avatar
              <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
            </Button>
          </Box>
        </Stack>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
            <TextField
              {...register("full_name")}
              label="Full Name"
              fullWidth
              error={!!errors.full_name}
              helperText={errors.full_name?.message}
            />
            <TextField
              {...register("headline")}
              label="Headline"
              fullWidth
              placeholder="e.g. Senior Legal Counsel"
              error={!!errors.headline}
              helperText={errors.headline?.message}
            />
            <TextField
              {...register("bio")}
              label="Bio"
              fullWidth
              multiline
              rows={4}
              error={!!errors.bio}
              helperText={errors.bio?.message}
            />
            <TextField {...register("location")} label="Location" fullWidth />
            <Controller
              name="experience_level"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Experience Level</InputLabel>
                  <Select {...field} label="Experience Level" value={field.value ?? ""}>
                    <MenuItem value="">Not specified</MenuItem>
                    {Object.entries(experienceLevelLabels).map(([val, label]) => (
                      <MenuItem key={val} value={val}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ alignSelf: "flex-start", px: 4 }}
            >
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          CV / Resume
        </Typography>
        <Button variant="outlined" component="label">
          Upload CV (PDF, max 5MB)
          <input type="file" hidden accept=".pdf" onChange={handleCvUpload} />
        </Button>
      </Paper>
    </>
  );
}
