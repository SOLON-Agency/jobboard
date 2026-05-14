/**
 * Notification types registry — Deno-compatible copy of src/lib/notifications/types.ts.
 * Keep these two files in sync whenever you add a new type.
 */

export type NotificationChannel = "email" | "browser" | "sms";

export const NOTIFICATION_TYPES = {
  ACCOUNT_CREATED: "account_created",
  ACCOUNT_DELETION_SCHEDULED: "account_deletion_scheduled",
  PASSWORD_RESET_OK: "password_reset_ok",
  PROFILE_UPDATED: "profile_updated",
  DAILY_DIGEST: "daily_digest",
  PROFILE_NUDGE: "profile_nudge",
  COMPANY_CREATED: "company_created",
  COMPANY_UPDATED: "company_updated",
  COMPANY_ARCHIVED: "company_archived",
  COMPANY_DELETED: "company_deleted",
  COMPANY_FAVORITED: "company_favorited",
  COMPANY_ENGAGEMENT_UP: "company_engagement_up",
  JOB_CREATED: "job_created",
  JOB_PUBLISHED: "job_published",
  JOB_EDITED: "job_edited",
  JOB_EXPIRES_TOMORROW: "job_expires_tomorrow",
  JOB_UNPUBLISHED: "job_unpublished",
  JOB_ARCHIVED: "job_archived",
  JOB_DELETED: "job_deleted",
  FORM_CREATED: "form_created",
  FORM_ARCHIVED: "form_archived",
  FORM_DELETED: "form_deleted",
  APPLICATION_NEW: "application_new",
  APPLICATION_WITHDRAWN: "application_withdrawn",
  APPLICATION_REJECTED: "application_rejected",
  ALERT_JOB_MATCH: "alert_job_match",
  RELEASE_ANNOUNCEMENT: "release_announcement",
  MATCHMAKING: "matchmaking",
} as const;

export type NotificationTypeKey =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_DEFAULTS: Record<
  NotificationTypeKey,
  Record<NotificationChannel, boolean>
> = {
  account_created:               { email: true,  browser: true,  sms: false },
  account_deletion_scheduled:    { email: true,  browser: true,  sms: false },
  password_reset_ok:             { email: true,  browser: false, sms: false },
  profile_updated:               { email: true,  browser: false, sms: false },
  daily_digest:                  { email: true,  browser: false, sms: false },
  profile_nudge:                 { email: true,  browser: true,  sms: false },
  company_created:               { email: true,  browser: true,  sms: false },
  company_updated:               { email: true,  browser: true,  sms: false },
  company_archived:              { email: true,  browser: true,  sms: false },
  company_deleted:               { email: true,  browser: true,  sms: false },
  company_favorited:             { email: true,  browser: true,  sms: false },
  company_engagement_up:         { email: true,  browser: false, sms: false },
  job_created:                   { email: true,  browser: true,  sms: false },
  job_published:                 { email: true,  browser: true,  sms: false },
  job_edited:                    { email: true,  browser: false, sms: false },
  job_expires_tomorrow:          { email: true,  browser: true,  sms: false },
  job_unpublished:               { email: true,  browser: true,  sms: false },
  job_archived:                  { email: true,  browser: true,  sms: false },
  job_deleted:                   { email: true,  browser: false, sms: false },
  form_created:                  { email: true,  browser: false, sms: false },
  form_archived:                 { email: true,  browser: false, sms: false },
  form_deleted:                  { email: true,  browser: false, sms: false },
  application_new:               { email: true,  browser: true,  sms: false },
  application_withdrawn:         { email: true,  browser: true,  sms: false },
  application_rejected:          { email: true,  browser: true,  sms: false },
  alert_job_match:               { email: true,  browser: true,  sms: false },
  release_announcement:          { email: true,  browser: true,  sms: false },
  matchmaking:                   { email: true,  browser: true,  sms: false },
};

export function isChannelEnabled(
  notificationPreferences: Record<string, Record<string, boolean>> | null | undefined,
  type: NotificationTypeKey,
  channel: NotificationChannel
): boolean {
  const prefs = notificationPreferences ?? {};
  const typePref = prefs[type];
  if (typePref && typeof typePref[channel] === "boolean") {
    return typePref[channel];
  }
  return NOTIFICATION_DEFAULTS[type]?.[channel] ?? false;
}
