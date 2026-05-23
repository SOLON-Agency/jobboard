"use client";

import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

/** Breakpoint below which a column is hidden (column is always visible from this breakpoint up). */
export type DashboardTableBreakpoint = "sm" | "md" | "lg";

export function dashboardColumnVisibility(
  hideBelow?: DashboardTableBreakpoint,
): SxProps<Theme> {
  if (!hideBelow) return {};
  return {
    display: {
      xs: "none",
      [hideBelow]: "table-cell",
    },
  };
}

const defaultCellSx: SxProps<Theme> = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export type DashboardTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Omit to keep the column visible on all breakpoints (including xs — use for the primary + action columns). */
  hideBelow?: DashboardTableBreakpoint;
  align?: "inherit" | "left" | "center" | "right" | "justify";
  headerAlign?: "inherit" | "left" | "center" | "right" | "justify";
  width?: number | string;
  cellSx?: SxProps<Theme>;
  headerSx?: SxProps<Theme>;
  sort?: {
    active: boolean;
    direction: "asc" | "desc";
    onClick: () => void;
  };
};

export type ResponsiveDashboardTableProps<T> = {
  rows: T[];
  columns: DashboardTableColumn<T>[];
  getRowId: (row: T) => string;
  ariaLabel: string;
  size?: "small" | "medium";
  caption?: React.ReactNode;
  emptyRow?: React.ReactNode;
  headerRowSx?: SxProps<Theme>;
  getRowSx?: (row: T) => SxProps<Theme> | undefined;
  onRowClick?: (row: T) => void;
  /** Additional table row(s) rendered immediately after each data row. */
  renderRowExtra?: (row: T) => React.ReactNode;
  containerComponent?: React.ElementType;
  containerSx?: SxProps<Theme>;
  tableSx?: SxProps<Theme>;
};

function combineSx(...parts: Array<SxProps<Theme> | false | null | undefined>): SxProps<Theme> {
  return parts.filter(Boolean) as SxProps<Theme>;
}

export function ResponsiveDashboardTable<T>({
  rows,
  columns,
  getRowId,
  ariaLabel,
  size = "small",
  caption,
  emptyRow,
  headerRowSx,
  getRowSx,
  onRowClick,
  renderRowExtra,
  containerComponent = Paper,
  containerSx,
  tableSx,
}: ResponsiveDashboardTableProps<T>) {
  const Container = containerComponent;

  return (
    <TableContainer
      component={Container}
      variant={Container === Paper ? "outlined" : undefined}
      sx={combineSx(
        {
          borderRadius: 2,
          overflowX: "auto",
          ...(Container !== Paper
            ? { border: "1px solid", borderColor: "divider" }
            : {}),
        },
        containerSx,
      )}
    >
      <Table size={size} aria-label={ariaLabel} sx={tableSx}>
        {caption ? (
          <Box
            component="caption"
            sx={{
              captionSide: "top",
              textAlign: "left",
              px: 2,
              py: 1.5,
              typography: "body2",
            }}
          >
            {caption}
          </Box>
        ) : null}
        <TableHead>
          <TableRow sx={combineSx({ bgcolor: "action.hover" }, headerRowSx)}>
            {columns.map((col) => (
              <TableCell
                key={col.id}
                align={col.headerAlign ?? col.align}
                width={col.width}
                sx={combineSx(dashboardColumnVisibility(col.hideBelow), col.headerSx)}
              >
                {col.sort ? (
                  <TableSortLabel
                    active={col.sort.active}
                    direction={col.sort.direction}
                    onClick={col.sort.onClick}
                  >
                    {col.header}
                  </TableSortLabel>
                ) : (
                  col.header
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <React.Fragment key={getRowId(row)}>
              <TableRow
                hover
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={combineSx(
                  onRowClick ? { cursor: "pointer" } : undefined,
                  index === rows.length - 1 && !renderRowExtra && !emptyRow
                    ? { "& td": { borderBottom: 0 } }
                    : undefined,
                  getRowSx?.(row),
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    align={col.align}
                    sx={combineSx(
                      dashboardColumnVisibility(col.hideBelow),
                      defaultCellSx,
                      col.cellSx,
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
              {renderRowExtra?.(row)}
            </React.Fragment>
          ))}
          {emptyRow}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
