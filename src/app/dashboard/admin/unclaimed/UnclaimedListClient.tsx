"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useToast } from "@/contexts/ToastContext";
import { deleteUnclaimedCompanyAction } from "./actions";
import type { UnclaimedCompanyRow } from "@/services/companies.service";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

interface Props {
  initialCompanies: UnclaimedCompanyRow[];
}

export function UnclaimedListClient({ initialCompanies }: Props) {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState(initialCompanies);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (company: UnclaimedCompanyRow) => {
    if (
      !window.confirm(
        `Ești sigur că vrei să ștergi compania "${company.name}" și toate anunțurile sale? Acțiunea este ireversibilă.`
      )
    ) {
      return;
    }

    setDeletingId(company.id);
    const result = await deleteUnclaimedCompanyAction(company.id);
    setDeletingId(null);

    if (result.error) {
      showToast(`Eroare: ${result.error}`, "error", 5000);
    } else {
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
      showToast(`Compania "${company.name}" a fost ștearsă.`, "info");
    }
  };

  if (companies.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 6, textAlign: "center", borderStyle: "dashed", borderRadius: 2 }}
      >
        <WorkOutlineIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
        <Typography color="text.secondary">
          Nu există companii nerevendicate. Creează una cu butonul de mai sus.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small" aria-label="Companii nerevendicate">
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "action.hover" } }}>
            <TableCell>Companie</TableCell>
            <TableCell>Email</TableCell>
            <TableCell align="center">Anunțuri</TableCell>
            <TableCell>Publicat</TableCell>
            <TableCell>Adăugat</TableCell>
            <TableCell align="right">Acțiuni</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {companies.map((company) => (
            <TableRow
              key={company.id}
              hover
              sx={{ "&:last-child td": { borderBottom: 0 } }}
            >
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {company.name}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {company.email ?? "—"}
                </Typography>
              </TableCell>

              <TableCell align="center">
                <Chip
                  label={company.jobCount}
                  size="small"
                  color={company.jobCount > 0 ? "primary" : "default"}
                  variant={company.jobCount > 0 ? "filled" : "outlined"}
                />
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(company.latestJobPublishedAt)}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(company.created_at)}
                </Typography>
              </TableCell>

              <TableCell align="right">
                <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                  {company.jobCount > 0 && (
                    <Link
                      href={`/companies/${company.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none" }}
                      aria-label={`Vizualizează anunțurile ${company.name} (se deschide în tab nou)`}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<OpenInNewIcon sx={{ fontSize: "0.9rem !important" }} />}
                      >
                        Anunțuri
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    startIcon={
                      deletingId === company.id ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <DeleteOutlineIcon />
                      )
                    }
                    onClick={() => void handleDelete(company)}
                    disabled={deletingId === company.id}
                    aria-label={`Șterge compania ${company.name}`}
                  >
                    Șterge
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
