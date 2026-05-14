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
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getAllSkills,
  getCompanySkills,
  addCompanySkill,
  removeCompanySkill,
  reorderCompanySkills,
  type CompanySkillWithName,
  type Skill,
} from "@/services/skills.service";
import { parseSupabaseError } from "@/lib/utils";

interface EditCompanySkillsProps {
  companyId: string;
  initialItems?: CompanySkillWithName[];
  loading?: boolean;
  onReload?: () => void;
}

export function EditCompanySkills({
  companyId,
  initialItems,
  loading = false,
  onReload,
}: EditCompanySkillsProps) {
  const supabase = useSupabase();

  const [items, setItems] = useState<CompanySkillWithName[]>(initialItems ?? []);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems ?? []);
  }, [initialItems]);

  useEffect(() => {
    getAllSkills(supabase)
      .then(setAllSkills)
      .catch(() => { /* non-critical */ });
  }, [supabase]);

  const handleAdd = useCallback(
    async (name: string) => {
      if (!name.trim()) return;
      const trimmed = name.trim();

      if (items.some((i) => i.skill.name.toLowerCase() === trimmed.toLowerCase())) {
        setInputValue("");
        return;
      }

      setAdding(true);
      setError(null);
      try {
        const newItem = await addCompanySkill(supabase, companyId, trimmed, items.length);
        setItems((prev) => [...prev, newItem]);
        setInputValue("");
        onReload?.();
      } catch (err) {
        setError(parseSupabaseError(err));
      } finally {
        setAdding(false);
      }
    },
    [supabase, companyId, items, onReload]
  );

  const handleRemove = useCallback(
    async (companySkillId: string) => {
      setError(null);
      try {
        await removeCompanySkill(supabase, companySkillId);
        const updated = items
          .filter((i) => i.id !== companySkillId)
          .map((item, idx) => ({ ...item, sort_order: idx }));
        await reorderCompanySkills(supabase, updated.map((i) => ({ id: i.id, sort_order: i.sort_order })));
        setItems(updated);
        onReload?.();
      } catch (err) {
        setError(parseSupabaseError(err));
      }
    },
    [supabase, items, onReload]
  );

  const move = useCallback(
    async (idx: number, dir: -1 | 1) => {
      const next = idx + dir;
      if (next < 0 || next >= items.length) return;
      const reordered = [...items];
      [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
      const withOrder = reordered.map((item, i) => ({ ...item, sort_order: i }));
      setItems(withOrder);
      await reorderCompanySkills(
        supabase,
        withOrder.map((i) => ({ id: i.id, sort_order: i.sort_order }))
      );
    },
    [supabase, items]
  );

  const addedIds = new Set(items.map((i) => i.skill.id));
  const options = allSkills.filter((s) => !addedIds.has(s.id));

  const trimmedInput = inputValue.trim();
  const isNewSkill =
    trimmedInput.length > 0 &&
    !options.some((s) => s.name.toLowerCase() === trimmedInput.toLowerCase()) &&
    !items.some((i) => i.skill.name.toLowerCase() === trimmedInput.toLowerCase());

  const helperText = error
    ? error
    : isNewSkill
    ? `„${trimmedInput}" va fi adăugată ca personalizată și va apărea pe pagina companiei după aprobare de admin.`
    : "Selectează din listă sau tastează o competență nouă și apasă Enter";

  return (
    <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <PsychologyOutlinedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
        <Typography variant="subtitle1" fontWeight={700}>
          Competențe
        </Typography>
      </Stack>

      <Autocomplete
        freeSolo
        options={options.map((s) => s.name)}
        inputValue={inputValue}
        onInputChange={(_, val) => setInputValue(val)}
        onChange={(_, value) => {
          if (value && typeof value === "string") void handleAdd(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && inputValue.trim()) {
            e.preventDefault();
            void handleAdd(inputValue);
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
            helperText={helperText}
            error={!!error}
            FormHelperTextProps={{
              sx: isNewSkill && !error ? { color: "warning.main" } : undefined,
            }}
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
          {items.map((item, idx) => {
            const isPending = item.skill.is_approved === false;
            return (
              <Tooltip
                key={item.id}
                title={
                  isPending
                    ? "Competență personalizată — va fi vizibilă public după aprobare de admin"
                    : ""
                }
                placement="left"
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: isPending ? "warning.light" : "divider",
                    bgcolor: isPending ? "warning.50" : "transparent",
                    "&:hover": { bgcolor: isPending ? "warning.50" : "action.hover" },
                  }}
                >
                  {isPending && (
                    <HourglassEmptyOutlinedIcon
                      sx={{ fontSize: 14, color: "warning.main", flexShrink: 0 }}
                      aria-label="În așteptare aprobare"
                    />
                  )}
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      color: isPending ? "warning.dark" : "text.primary",
                    }}
                  >
                    {item.skill.name}
                    {isPending && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ ml: 1, color: "warning.main", fontWeight: 400 }}
                      >
                        (în așteptare)
                      </Typography>
                    )}
                  </Typography>

                  <Stack direction="row" spacing={0.25}>
                    <Tooltip title="Mută sus">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => void move(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Mută sus"
                        >
                          <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Mută jos">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => void move(idx, 1)}
                          disabled={idx === items.length - 1}
                          aria-label="Mută jos"
                        >
                          <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Elimină">
                      <IconButton
                        size="small"
                        sx={{ color: "error.main" }}
                        onClick={() => void handleRemove(item.id)}
                        aria-label={`Elimină ${item.skill.name}`}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Tooltip>
            );
          })}
        </Stack>
      )}

      {items.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" color="text.disabled" sx={{ mb: 1, display: "block" }}>
            Previzualizare (vizibil pe pagina publică)
          </Typography>
          {items.every((i) => i.skill.is_approved === false) ? (
            <Typography variant="caption" color="text.disabled">
              Nicio competență aprobată momentan.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {items
                .filter((item) => item.skill.is_approved !== false)
                .map((item) => (
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
          )}
        </Box>
      )}
    </Paper>
  );

}
