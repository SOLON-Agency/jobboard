"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useToast } from "@/contexts/ToastContext";
import { deleteUnclaimedCompanyAction } from "./actions";
import type { UnclaimedCompanyRow } from "@/services/companies.service";
import {
  ResponsiveDashboardTable,
  type DashboardTableColumn,
} from "@/components/dashboard/ResponsiveDashboardTable";

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

  const handleDelete = useCallback(async (company: UnclaimedCompanyRow) => {
    if (
      !window.confirm(
        `Ești sigur că vrei să ștergi societatea "${company.name}" și toate anunțurile sale? Acțiunea este ireversibilă.`
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
      showToast(`Societatea "${company.name}" a fost ștearsă.`, "info");
    }
  }, [showToast]);

  const columns: DashboardTableColumn<UnclaimedCompanyRow>[] = [
      {
        id: "company",
        header: "Societate",
        cell: (company) => (
          <Typography variant="body2" fontWeight={600}>
            {company.name}
          </Typography>
        ),
      },
      {
        id: "email",
        header: "Email",
        hideBelow: "sm",
        cell: (company) => (
          <Typography variant="body2" color="text.secondary">
            {company.email ?? "—"}
          </Typography>
        ),
      },
      {
        id: "jobs",
        header: "Anunțuri",
        hideBelow: "sm",
        align: "center",
        headerAlign: "center",
        cell: (company) => (
          <Chip
            label={company.jobCount}
            size="small"
            color={company.jobCount > 0 ? "primary" : "default"}
            variant={company.jobCount > 0 ? "filled" : "outlined"}
          />
        ),
      },
      {
        id: "published",
        header: "Publicat",
        hideBelow: "md",
        cell: (company) => (
          <Typography variant="body2" color="text.secondary">
            {formatDate(company.latestJobPublishedAt)}
          </Typography>
        ),
      },
      {
        id: "created",
        header: "Adăugat",
        hideBelow: "lg",
        cell: (company) => (
          <Typography variant="body2" color="text.secondary">
            {formatDate(company.created_at)}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "Acțiuni",
        align: "right",
        headerAlign: "right",
        cell: (company) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {company.jobCount > 0 && (
              <Link
                href={`/societate/${company.slug}`}
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
              aria-label={`Șterge societatea ${company.name}`}
            >
              Șterge
            </Button>
          </Box>
        ),
      },
  ];

  if (companies.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 6, textAlign: "center", borderStyle: "dashed", borderRadius: 2 }}
      >
        <WorkOutlineIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
        <Typography color="text.secondary">
          Nu există societăți nerevendicate. Creează una cu butonul de mai sus.
        </Typography>
      </Paper>
    );
  }

  return (
    <ResponsiveDashboardTable
      rows={companies}
      columns={columns}
      getRowId={(company) => company.id}
      ariaLabel="Societăți nerevendicate"
      headerRowSx={{ "& th": { fontWeight: 700 } }}
      getRowSx={() => ({ "&:last-child td": { borderBottom: 0 } })}
    />
  );
}
