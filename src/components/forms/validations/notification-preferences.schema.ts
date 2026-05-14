import { z } from "zod";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_DEFAULTS,
  type NotificationChannel,
} from "@/lib/notifications/types";

// Schema for a single type row: three boolean channel toggles
const channelRowSchema = z.object({
  email: z.boolean(),
  browser: z.boolean(),
  sms: z.boolean(),
});

// Build an object schema keyed by every notification type value
const allTypeKeys = Object.values(NOTIFICATION_TYPES) as [string, ...string[]];

const perTypeSchema = z.object(
  Object.fromEntries(allTypeKeys.map((key) => [key, channelRowSchema])) as {
    [K in (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]]: typeof channelRowSchema;
  }
);

export const notificationPreferencesSchema = z.object({
  /** Master channel on/off toggles */
  notifications_email: z.boolean(),
  notifications_browser: z.boolean(),
  notifications_sms: z.boolean(),
  /** Per-type × per-channel matrix */
  preferences: perTypeSchema,
});

export type NotificationPreferencesFormData = z.infer<
  typeof notificationPreferencesSchema
>;

/** Helper to build default form values from the NOTIFICATION_DEFAULTS matrix,
 *  merged with whatever the user has already stored. */
export function buildDefaultValues(
  channelOn: { email: boolean; browser: boolean; sms: boolean },
  storedPrefs: Record<string, Record<NotificationChannel, boolean>> | null | undefined
): NotificationPreferencesFormData {
  const stored = storedPrefs ?? {};

  const preferences = Object.fromEntries(
    allTypeKeys.map((key) => {
      const typeKey = key as (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
      const defaults = NOTIFICATION_DEFAULTS[typeKey];
      const saved = stored[key] as Partial<Record<NotificationChannel, boolean>> | undefined;
      return [
        key,
        {
          email: saved?.email ?? defaults.email,
          browser: saved?.browser ?? defaults.browser,
          sms: saved?.sms ?? defaults.sms,
        },
      ];
    })
  ) as NotificationPreferencesFormData["preferences"];

  return {
    notifications_email: channelOn.email,
    notifications_browser: channelOn.browser,
    notifications_sms: channelOn.sms,
    preferences,
  };
}
