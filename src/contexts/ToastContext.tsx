"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { Alert, Slide, Snackbar, type AlertColor } from "@mui/material";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  severity: AlertColor;
  duration: number;
}

interface ToastContextValue {
  /** Show a brief notification. Defaults to severity="success", duration=3500 ms. */
  showToast: (message: string, severity?: AlertColor, duration?: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback(
    (message: string, severity: AlertColor = "success", duration = 3500) => {
      setToast({ id: Date.now(), message, severity, duration });
    },
    []
  );

  const handleClose = (_: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <Snackbar
        key={toast?.id}
        open={!!toast}
        autoHideDuration={toast?.duration ?? 3500}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        TransitionComponent={Slide as any}
        disableWindowBlurListener
        sx={{ mb: { xs: 2, sm: 3 } }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast(null)}
            role="status"
            aria-live="polite"
            sx={{
              minWidth: 280,
              maxWidth: 480,
              boxShadow: 4,
              fontSize: "0.875rem",
              alignItems: "center",
            }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
