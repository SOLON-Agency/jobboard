/**
 * Notification types registry — used by both Next.js and (duplicated) in
 * supabase/functions/_shared/notification-types.ts for Deno.
 *
 * Keep these two files in sync whenever you add a new type.
 */

export type NotificationChannel = "email" | "browser" | "sms";

export const NOTIFICATION_TYPES = {
  // ── Account & auth ──────────────────────────────────────────────────────
  ACCOUNT_CREATED: "account_created",
  ACCOUNT_DELETION_SCHEDULED: "account_deletion_scheduled",
  PASSWORD_RESET_OK: "password_reset_ok",
  // ── Profile ─────────────────────────────────────────────────────────────
  PROFILE_UPDATED: "profile_updated",
  DAILY_DIGEST: "daily_digest",
  PROFILE_NUDGE: "profile_nudge",
  // ── Company ─────────────────────────────────────────────────────────────
  COMPANY_CREATED: "company_created",
  COMPANY_UPDATED: "company_updated",
  COMPANY_ARCHIVED: "company_archived",
  COMPANY_DELETED: "company_deleted",
  COMPANY_FAVORITED: "company_favorited",
  COMPANY_ENGAGEMENT_UP: "company_engagement_up",
  // ── Job listings ─────────────────────────────────────────────────────────
  JOB_CREATED: "job_created",
  JOB_PUBLISHED: "job_published",
  JOB_EDITED: "job_edited",
  JOB_EXPIRES_TOMORROW: "job_expires_tomorrow",
  JOB_UNPUBLISHED: "job_unpublished",
  JOB_ARCHIVED: "job_archived",
  JOB_DELETED: "job_deleted",
  // ── Forms ────────────────────────────────────────────────────────────────
  FORM_CREATED: "form_created",
  FORM_ARCHIVED: "form_archived",
  FORM_DELETED: "form_deleted",
  // ── Applications ─────────────────────────────────────────────────────────
  APPLICATION_NEW: "application_new",
  APPLICATION_WITHDRAWN: "application_withdrawn",
  APPLICATION_REJECTED: "application_rejected",
  // ── Alerts & releases ────────────────────────────────────────────────────
  ALERT_JOB_MATCH: "alert_job_match",
  RELEASE_ANNOUNCEMENT: "release_announcement",
  // ── Matchmaking ──────────────────────────────────────────────────────────
  MATCHMAKING: "matchmaking",
} as const;

export type NotificationTypeKey =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// ─── Notification groups (used in the profile preferences UI) ────────────────

export interface NotificationGroup {
  label: string;
  types: NotificationTypeKey[];
}

export const NOTIFICATION_GROUPS: NotificationGroup[] = [
  {
    label: "Cont și profil",
    types: [
      NOTIFICATION_TYPES.ACCOUNT_CREATED,
      NOTIFICATION_TYPES.ACCOUNT_DELETION_SCHEDULED,
      NOTIFICATION_TYPES.PASSWORD_RESET_OK,
      NOTIFICATION_TYPES.PROFILE_UPDATED,
      NOTIFICATION_TYPES.DAILY_DIGEST,
      NOTIFICATION_TYPES.PROFILE_NUDGE,
    ],
  },
  {
    label: "Companie",
    types: [
      NOTIFICATION_TYPES.COMPANY_CREATED,
      NOTIFICATION_TYPES.COMPANY_UPDATED,
      NOTIFICATION_TYPES.COMPANY_ARCHIVED,
      NOTIFICATION_TYPES.COMPANY_DELETED,
      NOTIFICATION_TYPES.COMPANY_FAVORITED,
      NOTIFICATION_TYPES.COMPANY_ENGAGEMENT_UP,
    ],
  },
  {
    label: "Anunțuri de muncă",
    types: [
      NOTIFICATION_TYPES.JOB_CREATED,
      NOTIFICATION_TYPES.JOB_PUBLISHED,
      NOTIFICATION_TYPES.JOB_EDITED,
      NOTIFICATION_TYPES.JOB_EXPIRES_TOMORROW,
      NOTIFICATION_TYPES.JOB_UNPUBLISHED,
      NOTIFICATION_TYPES.JOB_ARCHIVED,
      NOTIFICATION_TYPES.JOB_DELETED,
    ],
  },
  {
    label: "Formulare",
    types: [
      NOTIFICATION_TYPES.FORM_CREATED,
      NOTIFICATION_TYPES.FORM_ARCHIVED,
      NOTIFICATION_TYPES.FORM_DELETED,
    ],
  },
  {
    label: "Candidaturi",
    types: [
      NOTIFICATION_TYPES.APPLICATION_NEW,
      NOTIFICATION_TYPES.APPLICATION_WITHDRAWN,
      NOTIFICATION_TYPES.APPLICATION_REJECTED,
    ],
  },
  {
    label: "Alerte și noutăți",
    types: [
      NOTIFICATION_TYPES.ALERT_JOB_MATCH,
      NOTIFICATION_TYPES.RELEASE_ANNOUNCEMENT,
    ],
  },
  {
    label: "Potriviri",
    types: [
      NOTIFICATION_TYPES.MATCHMAKING,
    ],
  },
];

// ─── Human-readable labels (Romanian) ────────────────────────────────────────

export const NOTIFICATION_TYPE_LABELS: Record<NotificationTypeKey, string> = {
  account_created: "Cont creat",
  account_deletion_scheduled: "Cont programat pentru ștergere",
  password_reset_ok: "Parolă resetată cu succes",
  profile_updated: "Profil actualizat",
  daily_digest: "Rezumat zilnic",
  profile_nudge: "Completează-ți profilul",
  company_created: "Companie creată",
  company_updated: "Profil companie actualizat",
  company_archived: "Companie arhivată",
  company_deleted: "Companie ștearsă",
  company_favorited: "Companie adăugată la favorite",
  company_engagement_up: "Interacțiuni companie în creștere",
  job_created: "Anunț nou creat",
  job_published: "Anunț publicat",
  job_edited: "Anunț modificat",
  job_expires_tomorrow: "Anunț expiră mâine",
  job_unpublished: "Anunț retras",
  job_archived: "Anunț arhivat",
  job_deleted: "Anunț șters",
  form_created: "Formular creat",
  form_archived: "Formular arhivat",
  form_deleted: "Formular șters",
  application_new: "Candidatură nouă",
  application_withdrawn: "Candidatură retrasă",
  application_rejected: "Candidatură respinsă",
  alert_job_match: "Alertă – anunț potrivit",
  release_announcement: "Noutăți platformă",
  matchmaking: "Potrivire competențe",
};

// ─── Default channel matrix ───────────────────────────────────────────────────
//
// Keys present in profiles.notification_preferences OVERRIDE these defaults.
// If a key is absent from the user's preferences JSON, the default below applies.

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

// ─── Preference resolution helper ─────────────────────────────────────────────

/** Returns true when a specific user pref overrides the default, or defaults to the default. */
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
