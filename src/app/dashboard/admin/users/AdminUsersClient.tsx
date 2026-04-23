"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useSupabase } from "@/hooks/useSupabase";
import { ROLE_LABELS, ROLE_ORDER, type UserRole } from "@/lib/roles";
import { formatDate, parseSupabaseError } from "@/lib/utils";

type AdminUser = {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  created_at: string;
  avatar_url: string | null;
};

type SortField = "full_name" | "email" | "role" | "created_at";
type SortDir = "asc" | "desc";

const ROLE_COLOR: Record<
  UserRole,
  "default" | "primary" | "secondary" | "success" | "warning" | "error"
> = {
  user: "default",
  employer: "primary",
  premium_employer: "success",
  admin: "error",
};

export function AdminUsersClient() {
  const supabase = useSupabase();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const load = useCallback(async () => {
    try {
      const { data, error: rpcErr } = await supabase.rpc("admin_list_users");
      if (rpcErr) throw rpcErr;
      setUsers((data ?? []) as AdminUser[]);
    } catch (err) {
      setError(parseSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const handleRoleChange = useCallback(
    async (userId: string, newRole: UserRole) => {
      setPendingRole((p) => ({ ...p, [userId]: true }));
      setError(null);
      setSuccessMsg(null);
      const previous = users;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      try {
        const { error: rpcErr } = await supabase.rpc("admin_set_user_role", {
          p_user_id: userId,
          p_role: newRole,
        });
        if (rpcErr) throw rpcErr;
        setSuccessMsg("Rolul a fost actualizat.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        setUsers(previous);
        setError(parseSupabaseError(err));
      } finally {
        setPendingRole((p) => ({ ...p, [userId]: false }));
      }
    },
    [supabase, users]
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
    let rows = users;
    if (filterRole !== "all") rows = rows.filter((u) => u.role === filterRole);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (u) =>
          (u.full_name ?? "").toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      let va = "";
      let vb = "";
      if (sortField === "full_name") {
        va = a.full_name ?? "";
        vb = b.full_name ?? "";
      } else if (sortField === "email") {
        va = a.email;
        vb = b.email;
      } else if (sortField === "role") {
        va = ROLE_ORDER.indexOf(a.role).toString();
        vb = ROLE_ORDER.indexOf(b.role).toString();
      } else {
        va = a.created_at;
        vb = b.created_at;
      }
      const cmp = va.localeCompare(vb, "ro");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [users, filterRole, search, sortField, sortDir]);

  if (loading) {
    return (
      <>
        <Stack sx={{ mb: 2 }} spacing={1}>
          <Skeleton variant="text" width={220} height={40} />
          <Skeleton variant="rounded" height={40} />
        </Stack>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />
        ))}
      </>
    );
  }

  return (
    <>
      <Stack sx={{ mb: 3 }} spacing={0.5}>
        <Typography variant="h3">Utilizatori</Typography>
        <Typography variant="body2" color="text.secondary">
          {users.length} utilizator{users.length !== 1 ? "i" : ""} înregistrat{users.length !== 1 ? "i" : ""}
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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3 }}
        useFlexGap
      >
        <TextField
          size="small"
          placeholder="Caută după nume sau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          inputProps={{ "aria-label": "Caută utilizator" }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | "all")}
            displayEmpty
            inputProps={{ "aria-label": "Filtrează după rol" }}
          >
            <MenuItem value="all">Toate rolurile</MenuItem>
            {ROLE_ORDER.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {filtered.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2 }}>
          <GroupOutlinedIcon sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
          <Typography color="text.secondary">
            Niciun utilizator nu corespunde filtrelor.
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2, overflowX: "auto" }}
        >
          <Table size="small" aria-label="Lista utilizatorilor">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "full_name"}
                    direction={sortField === "full_name" ? sortDir : "asc"}
                    onClick={() => handleSort("full_name")}
                  >
                    Utilizator
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "email"}
                    direction={sortField === "email" ? sortDir : "asc"}
                    onClick={() => handleSort("email")}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "role"}
                    direction={sortField === "role" ? sortDir : "asc"}
                    onClick={() => handleSort("role")}
                  >
                    Rol
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "created_at"}
                    direction={sortField === "created_at" ? sortDir : "asc"}
                    onClick={() => handleSort("created_at")}
                  >
                    Înregistrat
                  </TableSortLabel>
                </TableCell>
                <TableCell>Schimbă rol</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar
                        src={u.avatar_url ?? undefined}
                        sx={{ width: 32, height: 32, flexShrink: 0 }}
                        aria-hidden="true"
                      >
                        <PersonOutlineIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="body2" fontWeight={500} noWrap>
                        {u.full_name ?? "—"}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {u.email}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={ROLE_LABELS[u.role]}
                      color={ROLE_COLOR[u.role]}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {formatDate(u.created_at)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ minWidth: 170 }}>
                      <FormControl size="small" fullWidth disabled={pendingRole[u.id]}>
                        <Select
                          value={u.role}
                          onChange={(e) =>
                            void handleRoleChange(u.id, e.target.value as UserRole)
                          }
                          inputProps={{
                            "aria-label": `Rol pentru ${u.full_name ?? u.email}`,
                          }}
                        >
                          {ROLE_ORDER.map((r) => (
                            <MenuItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
        {filtered.length} din {users.length} utilizator{users.length !== 1 ? "i" : ""}
      </Typography>
    </>
  );
}
