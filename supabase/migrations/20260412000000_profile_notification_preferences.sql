-- Add per-channel notification preference flags to profiles.
-- Both default to TRUE so existing users receive notifications unless they opt out.
-- notifications_sms is added now but kept nullable (no SMS provider yet).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notifications_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notifications_sms   boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.notifications_email IS
  'When true the user receives transactional email notifications via Resend.';
COMMENT ON COLUMN public.profiles.notifications_sms IS
  'When true the user will receive SMS notifications (provider TBD).';
