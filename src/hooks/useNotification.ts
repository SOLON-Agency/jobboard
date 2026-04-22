"use client";

import { useState, useCallback } from "react";

export type NotificationSeverity = "success" | "error" | "warning" | "info";

export interface Notification {
  message: string;
  severity: NotificationSeverity;
}

export interface UseNotificationReturn {
  notification: Notification | null;
  notify: (message: string, severity?: NotificationSeverity) => void;
  clearNotification: () => void;
}

/**
 * Unified notification hook. Returns a `notify` function to trigger a
 * success/error/warning/info message and a `clearNotification` to dismiss it.
 * Render `<Snackbar>` + `<Alert>` in the component using the returned state.
 *
 * Replaces the ad-hoc `message`/`feedback`/`submitError` + `<Alert>` patterns
 * found across dashboard pages and forms.
 *
 * @pattern Notification
 * @usedBy dashboard/profile, dashboard/company, dashboard/jobs, dashboard/forms,
 *         dashboard/applications, dashboard/archive, dashboard/alerts
 * @example
 * ```tsx
 * const { notification, notify, clearNotification } = useNotification();
 *
 * // On save success:
 * notify("Profilul a fost salvat.", "success");
 *
 * // In JSX:
 * <Snackbar open={!!notification} autoHideDuration={4000} onClose={clearNotification}>
 *   <Alert severity={notification?.severity} onClose={clearNotification}>
 *     {notification?.message}
 *   </Alert>
 * </Snackbar>
 * ```
 */
export function useNotification(): UseNotificationReturn {
  const [notification, setNotification] = useState<Notification | null>(null);

  const notify = useCallback(
    (message: string, severity: NotificationSeverity = "success") => {
      setNotification({ message, severity });
    },
    []
  );

  const clearNotification = useCallback(() => setNotification(null), []);

  return { notification, notify, clearNotification };
}
