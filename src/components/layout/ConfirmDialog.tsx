"use client";

import React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** MUI Button color for the confirm button. Defaults to "error". */
  confirmColor?: "error" | "warning" | "primary" | "inherit";
  /** Shows a spinner and disables both buttons while the action is in flight. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation dialog built on MUI Dialog.
 * Replaces `window.confirm()` throughout the dashboard.
 *
 * @example
 * const [open, setOpen] = useState(false);
 *
 * <ConfirmDialog
 *   open={open}
 *   title="Arhivează compania"
 *   body={`Ești sigur că vrei să arhivezi compania „${company.name}"?`}
 *   confirmLabel="Arhivează"
 *   onConfirm={handleConfirm}
 *   onCancel={() => setOpen(false)}
 * />
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirmă",
  cancelLabel = "Anulează",
  confirmColor = "error",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 700 }}>
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {body}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outlined"
          color="inherit"
          sx={{ borderColor: "divider", color: "text.secondary" }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          autoFocus
        >
          {loading ? "Se procesează…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
