"use client";

import { Paper, Typography, Stack } from "@mui/material";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/**
 * Centered empty-state card shown when a list has no items.
 * Replaces the repeated `<Paper p: 6, textAlign: "center">` pattern.
 *
 * @pattern EmptyState
 * @usedBy forms/page, forms/[id]/responses/page, dashboard/applications/page
 * @example
 * ```tsx
 * <EmptyState
 *   title="Niciun formular"
 *   description="Adaugă primul tău formular."
 *   action={<Button>Adaugă</Button>}
 * />
 * ```
 */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 6,
        textAlign: "center",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Stack alignItems="center" spacing={2}>
        {icon}
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
        {action}
      </Stack>
    </Paper>
  );
}
