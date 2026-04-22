"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getAllSkills,
  getProfileSkills,
  addProfileSkill,
  removeProfileSkill,
  reorderProfileSkills,
  type ProfileSkillWithName,
  type Skill,
} from "@/services/skills.service";
import { parseSupabaseError } from "@/lib/utils";

interface EditSkillsProps {
  initialItems?: ProfileSkillWithName[];
  loading?: boolean;
  onReload?: () => void;
}

export function EditSkills({
  initialItems,
  loading = false,
  onReload,
}: EditSkillsProps) {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [items, setItems] = useState<ProfileSkillWithName[]>(initialItems ?? []);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when the parent finishes loading and passes real data for the first time.
  useEffect(() => {
    setItems(initialItems ?? []);
  }, [initialItems]);

  // Load master skills catalogue on mount
  useEffect(() => {
    getAllSkills(supabase)
      .then(setAllSkills)
      .catch(() => { /* non-critical */ });
  }, [supabase]);

  const reload = useCallback(async () => {
    if (!user) return;
    const data = await getProfileSkills(supabase, user.id);
    setItems(data);
    onReload?.();
  }, [user, supabase, onReload]);

  // ── Add skill ─────────────────────────────────────────────────────────────
  const handleAdd = useCallback(
    async (name: string) => {
      if (!user || !name.trim()) return;
      const trimmed = name.trim();

      // Guard against duplicates
      if (items.some((i) => i.skill.name.toLowerCase() === trimmed.toLowerCase())) {
        setInputValue("");
        return;
      }

      setAdding(true);
      setError(null);
      try {
        const newItem = await addProfileSkill(supabase, user.id, trimmed, items.length);
        setItems((prev) => [...prev, newItem]);
        // Keep local allSkills in sync if a new skill was created
        if (!allSkills.some((s) => s.id === newItem.skill.id)) {
          setAllSkills((prev) => [...prev, newItem.skill].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setInputValue("");
        onReload?.();
      } catch (err) {
        setError(parseSupabaseError(err));
      } finally {
        setAdding(false);
      }
    },
    [user, supabase, items, allSkills, onReload]
  );

  // ── Remove skill ──────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    async (profileSkillId: string) => {
      setError(null);
      try {
        await removeProfileSkill(supabase, profileSkillId);
        const updated = items
          .filter((i) => i.id !== profileSkillId)
          .map((item, idx) => ({ ...item, sort_order: idx }));
        await reorderProfileSkills(supabase, updated.map((i) => ({ id: i.id, sort_order: i.sort_order })));
        setItems(updated);
        onReload?.();
      } catch (err) {
        setError(parseSupabaseError(err));
      }
    },
    [supabase, items, onReload]
  );

  // ── Reorder ───────────────────────────────────────────────────────────────
  const move = useCallback(
    async (idx: number, dir: -1 | 1) => {
      const next = idx + dir;
      if (next < 0 || next >= items.length) return;
      const reordered = [...items];
      [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
      const withOrder = reordered.map((item, i) => ({ ...item, sort_order: i }));
      setItems(withOrder);
      await reorderProfileSkills(
        supabase,
        withOrder.map((i) => ({ id: i.id, sort_order: i.sort_order }))
      );
    },
    [supabase, items]
  );

  // ── Autocomplete options (exclude already-added skills) ───────────────────
  const addedIds = new Set(items.map((i) => i.skill.id));
  const options = allSkills.filter((s) => !addedIds.has(s.id));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <LabelOutlinedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
        <Typography variant="subtitle1" fontWeight={700}>
          Competențe
        </Typography>
      </Stack>

      {/* ── Typeahead input ── */}
      <Autocomplete
        freeSolo
        options={options.map((s) => s.name)}
        inputValue={inputValue}
        onInputChange={(_, val) => setInputValue(val)}
        onChange={(_, value) => {
          if (value && typeof value === "string") handleAdd(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && inputValue.trim()) {
            e.preventDefault();
            handleAdd(inputValue);
          }
        }}
        filterOptions={(opts, state) =>
          opts.filter((o) =>
            o.toLowerCase().includes(state.inputValue.toLowerCase())
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Adaugă o competență"
            placeholder="ex. Drept civil, Litigii..."
            size="small"
            helperText={error ?? "Selectează din listă sau tastează o competență personalizată și apasă Enter"}
            error={!!error}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {adding && <CircularProgress size={14} sx={{ mr: 1 }} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{ mb: 2 }}
        disabled={adding}
      />

      {/* ── Chip list (current skills) ── */}
      {loading ? (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" width={90} height={32} sx={{ borderRadius: "20px" }} />
          ))}
        </Stack>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.disabled">
          Nicio competență adăugată.
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          {items.map((item, idx) => (
            <Stack
              key={item.id}
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Typography variant="body2" fontWeight={500}
                sx={{ flex: 1, minWidth: 0, wordBreak: "break-word", overflowWrap: "break-word" }}>
                {item.skill.name}
              </Typography>

              <Stack direction="row" spacing={0.25}>
                <Tooltip title="Mută sus">
                  <span>
                    <IconButton size="small" onClick={() => move(idx, -1)} disabled={idx === 0}>
                      <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Mută jos">
                  <span>
                    <IconButton size="small" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>
                      <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Elimină">
                  <IconButton size="small" sx={{ color: "error.main" }} onClick={() => handleRemove(item.id)}>
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}

      {/* ── Tag preview (read-only mini preview) ── */}
      {items.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" color="text.disabled" sx={{ mb: 1, display: "block" }}>
            Previzualizare
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {items.map((item) => (
              <Chip
                key={item.id}
                label={item.skill.name}
                size="small"
                sx={{
                  bgcolor: "rgba(3,23,12,0.06)",
                  color: "text.primary",
                  fontWeight: 500,
                  border: "none",
                  borderRadius: "20px",
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};
