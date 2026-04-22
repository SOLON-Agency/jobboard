"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormHelperText,
  TextField,
  Typography,
} from "@mui/material";
import {
  WITHDRAW_REASON_MAX,
  withdrawApplicationSchema,
  type WithdrawApplicationFormData,
} from "@/components/forms/validations/withdraw-application.schema";

interface WithdrawApplicationFormProps {
  open: boolean;
  jobTitle?: string | null;
  onClose: () => void;
  onSubmit: (data: WithdrawApplicationFormData) => Promise<void> | void;
  submitLabel?: string;
  title?: string;
  description?: React.ReactNode;
}

export const WithdrawApplicationForm: React.FC<
  WithdrawApplicationFormProps
> = ({
  open,
  jobTitle,
  onClose,
  onSubmit,
  submitLabel = "Retrage aplicația",
  title = "Retrage aplicația",
  description,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WithdrawApplicationFormData>({
    resolver: zodResolver(withdrawApplicationSchema),
    defaultValues: { reason: "" },
  });

  const reasonValue = watch("reason") ?? "";

  const handleClose = () => {
    if (isSubmitting) return;
    reset({ reason: "" });
    onClose();
  };

  const handleValid = async (data: WithdrawApplicationFormData) => {
    await onSubmit({ reason: data.reason.trim() });
    reset({ reason: "" });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="withdraw-dialog-title"
      aria-describedby="withdraw-dialog-description"
    >
      <DialogTitle id="withdraw-dialog-title" sx={{ fontWeight: 700, pb: 1 }}>
        {title}
      </DialogTitle>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(handleValid)}
      >
        <DialogContent sx={{ pt: 1 }}>
          <DialogContentText
            id="withdraw-dialog-description"
            sx={{ mb: 2, color: "text.primary" }}
          >
            {description ?? (
              <>
                {jobTitle ? (
                  <>
                    Ești pe cale să retragi candidatura pentru{" "}
                    <Typography component="span" fontWeight={700}>
                      {jobTitle}
                    </Typography>
                    .{" "}
                  </>
                ) : (
                  "Ești pe cale să îți retragi candidatura. "
                )}
                Te rugăm să ne spui de ce — motivul va fi trimis angajatorului
                pentru a primi un feedback mai clar.
              </>
            )}
          </DialogContentText>

          <TextField
            {...register("reason")}
            label="Motiv"
            placeholder="Ex.: Am acceptat o altă ofertă, nu se mai potrivește cu planurile mele..."
            multiline
            minRows={4}
            maxRows={8}
            fullWidth
            required
            autoFocus
            error={!!errors.reason}
            helperText={errors.reason?.message}
            inputProps={{
              maxLength: WITHDRAW_REASON_MAX,
              "aria-describedby": "withdraw-reason-counter",
              "aria-required": "true",
            }}
          />
          <FormHelperText
            id="withdraw-reason-counter"
            sx={{ textAlign: "right", mt: 0.5 }}
          >
            {reasonValue.length} / {WITHDRAW_REASON_MAX}
          </FormHelperText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Anulează
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="warning"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Se salvează…" : submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
