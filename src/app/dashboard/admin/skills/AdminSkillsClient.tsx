"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import { useSupabase } from "@/hooks/useSupabase";
import { getAllSkillsAdmin } from "@/services/skills.service";
import { parseSupabaseError } from "@/lib/utils";
import type { Skill } from "@/services/skills.service";
import {
  ResponsiveDashboardTable,
  type DashboardTableColumn,
} from "@/components/dashboard/ResponsiveDashboardTable";

type SortField = "name" | "is_approved";
type SortDir = "asc" | "desc";

export function AdminSkillsClient() {
  const supabase = useSupabase();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState("");
  const [filterApproved, setFilterApproved] = useState<"all" | "approved" | "pending">("all");
  const [sortField, setSortField] = useState<SortField>("is_approved");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const load = useCallback(async () => {
    try {
      const data = await getAllSkillsAdmin(supabase);
      setSkills(data);
    } catch (err) {
      setError(parseSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const handleToggleApproval = useCallback(
    async (skillId: string, approved: boolean) => {
      setPending((p) => ({ ...p, [skillId]: true }));
      setError(null);
      const previous = skills;
      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? { ...s, is_approved: approved } : s))
      );
      try {
        const { error: rpcErr } = await supabase.rpc("admin_set_skill_approval", {
          p_skill_id: skillId,
          p_is_approved: approved,
        });
        if (rpcErr) throw rpcErr;
        setSuccessMsg(`Competența a fost ${approved ? "aprobată" : "respinsă"}.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        setSkills(previous);
        setError(parseSupabaseError(err));
      } finally {
        setPending((p) => ({ ...p, [skillId]: false }));
      }
    },
    [supabase, skills]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let rows = skills;
    if (filterApproved === "approved") rows = rows.filter((s) => s.is_approved);
    if (filterApproved === "pending") rows = rows.filter((s) => !s.is_approved);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((s) => s.name.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      let va = "";
      let vb = "";
      if (sortField === "name") {
        va = a.name;
        vb = b.name;
      } else if (sortField === "is_approved") {
        va = a.is_approved ? "1" : "0";
        vb = b.is_approved ? "1" : "0";
      } else {
        va = a.name;
        vb = b.name;
      }
      const cmp = va.localeCompare(vb, "ro");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [skills, filterApproved, search, sortField, sortDir]);

  const pendingCount = useMemo(() => skills.filter((s) => !s.is_approved).length, [skills]);

  const columns: DashboardTableColumn<Skill>[] = [
      {
        id: "name",
        header: "Competență",
        sort: {
          active: sortField === "name",
          direction: sortField === "name" ? sortDir : "asc",
          onClick: () => handleSort("name"),
        },
        cell: (skill) => (
          <Typography variant="body2" fontWeight={500}>
            {skill.name}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        hideBelow: "sm",
        sort: {
          active: sortField === "is_approved",
          direction: sortField === "is_approved" ? sortDir : "asc",
          onClick: () => handleSort("is_approved"),
        },
        cell: (skill) => (
          <Chip
            label={skill.is_approved ? "Aprobată" : "În așteptare"}
            color={skill.is_approved ? "success" : "warning"}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        id: "approval",
        header: "Aprobare",
        cell: (skill) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={skill.is_approved ? "Retrage aprobarea" : "Aprobă competența"}>
              <Switch
                checked={skill.is_approved ?? false}
                onChange={(_, checked) => void handleToggleApproval(skill.id, checked)}
                disabled={pending[skill.id]}
                size="small"
                color="success"
                inputProps={{
                  "aria-label": `${skill.is_approved ? "Retrage aprobarea" : "Aprobă"} competența ${skill.name}`,
                }}
              />
            </Tooltip>
          </Box>
        ),
      },
  ];

  if (loading) {
    return (
      <>
        <Stack sx={{ mb: 2 }} spacing={1}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rounded" height={40} />
        </Stack>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 0.75 }} />
        ))}
      </>
    );
  }

  return (
    <>
      <Stack sx={{ mb: 3 }} spacing={0.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h3">Competențe</Typography>
          {pendingCount > 0 && (
            <Chip
              label={`${pendingCount} în așteptare`}
              color="warning"
              size="small"
            />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Aprobă sau respinge competențele adăugate de utilizatori. Numai
          competențele aprobate apar în lista de selecție a altor utilizatori.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} role="status">
          {successMsg}
        </Alert>
      )}

      {/* Filters */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }} useFlexGap>
        <TextField
          size="small"
          placeholder="Caută competență..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          inputProps={{ "aria-label": "Caută competență" }}
        />
        <Stack direction="row" spacing={1}>
          {(["all", "pending", "approved"] as const).map((f) => (
            <Chip
              key={f}
              label={f === "all" ? "Toate" : f === "pending" ? "În așteptare" : "Aprobate"}
              onClick={() => setFilterApproved(f)}
              color={filterApproved === f ? "primary" : "default"}
              variant={filterApproved === f ? "filled" : "outlined"}
              size="small"
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Stack>
      </Stack>

      {filtered.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2 }}>
          <PsychologyOutlinedIcon sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
          <Typography color="text.secondary">
            {skills.length === 0
              ? "Nicio competență înregistrată."
              : "Niciun rezultat pentru filtrele selectate."}
          </Typography>
        </Paper>
      ) : (
        <ResponsiveDashboardTable
          rows={filtered}
          columns={columns}
          getRowId={(skill) => skill.id}
          ariaLabel="Lista competențelor"
          getRowSx={(skill) => ({
            bgcolor: !skill.is_approved ? "warning.50" : "inherit",
          })}
        />
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
        {filtered.length} din {skills.length} competențe/{skills.length !== 1 ? "e" : ""}
      </Typography>
    </>
  );
}
