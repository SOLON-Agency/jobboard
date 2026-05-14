"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneAndroidOutlinedIcon from "@mui/icons-material/PhoneAndroidOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import {
  notificationPreferencesSchema,
  buildDefaultValues,
  type NotificationPreferencesFormData,
} from "@/components/forms/validations/notification-preferences.schema";
import {
  NOTIFICATION_GROUPS,
  NOTIFICATION_TYPE_LABELS,
  type NotificationChannel,
} from "@/lib/notifications/types";
import {
  subscribeUserToPush,
  unsubscribeUserFromPush,
  isPushSubscribed,
  getPushPermission,
} from "@/lib/push";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/contexts/ToastContext";
import appSettings from "@/config/app.settings.json";
import type { Tables } from "@/types/database";

type ProfileRow = Tables<"profiles">;

interface NotificationsSettingsProps {
  profile: ProfileRow | null;
  onSaved?: () => void;
}

type ChannelMeta = {
  key: NotificationChannel;
  label: string;
  icon: React.ReactNode;
};

const ALL_CHANNELS: ChannelMeta[] = [
  {
    key: "email",
    label: "E-mail",
    icon: <EmailOutlinedIcon fontSize="small" aria-hidden />,
  },
  {
    key: "browser",
    label: "Browser",
    icon: <NotificationsNoneOutlinedIcon fontSize="small" aria-hidden />,
  },
  {
    key: "sms",
    label: "SMS",
    icon: <PhoneAndroidOutlinedIcon fontSize="small" aria-hidden />,
  },
];

const features = appSettings.features as Record<string, unknown>;
const allowEmailNotificationOptOut = features.allowEmailNotificationOptOut === true;
const smsNotifications = features.smsNotifications === true;

// Only include SMS column when the feature is enabled
const CHANNELS = smsNotifications
  ? ALL_CHANNELS
  : ALL_CHANNELS.filter((c) => c.key !== "sms");

export function NotificationsSettings({
  profile,
  onSaved,
}: NotificationsSettingsProps) {
  const supabase = useSupabase();
  const { showToast } = useToast();

  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // Cast to access columns added by migration that aren't yet in generated types
  const profileExt = profile as (typeof profile & {
    notifications_browser?: boolean | null;
    notifications_sms?: boolean | null;
    notification_preferences?: Record<string, Record<NotificationChannel, boolean>> | null;
  }) | null;

  const defaultValues = buildDefaultValues(
    {
      email: profileExt?.notifications_email !== false,
      browser: profileExt?.notifications_browser === true,
      sms: profileExt?.notifications_sms === true,
    },
    profileExt?.notification_preferences ?? null
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<NotificationPreferencesFormData>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues,
  });

  const emailOn = watch("notifications_email");
  const browserOn = watch("notifications_browser");
  const smsOn = smsNotifications ? watch("notifications_sms") : false;

  // Sync push subscription state with UI
  useEffect(() => {
    setPushPermission(getPushPermission());
    isPushSubscribed().then(setPushSubscribed).catch(() => void 0);
  }, []);

  const handleBrowserToggle = useCallback(
    async (checked: boolean) => {
      if (checked) {
        if (pushPermission === "denied") return;
        setPushLoading(true);
        const success = await subscribeUserToPush(supabase);
        setPushLoading(false);
        if (success) {
          setPushSubscribed(true);
          setPushPermission(getPushPermission());
          setValue("notifications_browser", true, { shouldDirty: true });
        } else {
          setPushPermission(getPushPermission());
        }
      } else {
        setPushLoading(true);
        await unsubscribeUserFromPush(supabase);
        setPushLoading(false);
        setPushSubscribed(false);
        setValue("notifications_browser", false, { shouldDirty: true });
      }
    },
    [pushPermission, supabase, setValue]
  );

  const onSubmit = async (data: NotificationPreferencesFormData) => {
    if (!profile) return;
    const { error } = await (supabase.from("profiles") as ReturnType<typeof supabase.from>)
      .update({
        notifications_email: data.notifications_email,
        // Fields added by migration — cast to bypass stale generated types
        ...({
          notifications_browser: data.notifications_browser,
          ...(smsNotifications && { notifications_sms: data.notifications_sms }),
          notification_preferences: data.preferences,
        } as unknown as Record<string, unknown>),
      })
      .eq("id", profile.id);

    if (error) {
      showToast("Nu s-au putut salva preferințele.", "error", 5000);
    } else {
      showToast("Preferințe de notificare salvate.", "success");
      onSaved?.();
    }
  };

  if (!profile) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rectangular" height={120} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  return (
    <Paper
      component="section"
      aria-labelledby="notif-settings-heading"
      sx={{ mt: 3, p: 3, border: "1px solid", borderColor: "divider" }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <NotificationsActiveOutlinedIcon color="primary" aria-hidden />
        <Typography
          id="notif-settings-heading"
          component="h2"
          variant="h6"
          fontWeight={700}
        >
          Notificări
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Controlează canalele de notificare și tipurile de eventi pentru care primești
        actualizări.
      </Typography>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        aria-label="Setări notificări"
      >
        {/* ── Channel master toggles ────────────────────────────────────────── */}
        <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
          <Typography component="legend" variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Canale active
          </Typography>
          <FormGroup>
            {/* Email */}
            <Controller
              name="notifications_email"
              control={control}
              render={({ field }) => (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(_, c) => field.onChange(c)}
                        disabled={
                          isSubmitting ||
                          (!allowEmailNotificationOptOut && field.value)
                        }
                        inputProps={{
                          "aria-describedby": "notif-email-hint",
                          "aria-required": "false",
                        }}
                      />
                    }
                    label={
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <EmailOutlinedIcon sx={{ fontSize: 18 }} aria-hidden />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            E-mail
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                            display="block"
                          >
                            Candidaturi, confirmări și mesaje legate de cont.
                          </Typography>
                        </Box>
                      </Stack>
                    }
                    sx={{ alignItems: "flex-start", mx: 0, gap: 1, mb: 1 }}
                  />
                  <FormHelperText id="notif-email-hint" sx={{ mx: 0, mb: 2, maxWidth: 560 }}>
                    {allowEmailNotificationOptOut
                      ? "Dacă oprești e-mailurile, nu vei mai primi notificări pe acest canal."
                      : "E-mailul este canalul de bază și nu poate fi dezactivat complet."}
                  </FormHelperText>
                </>
              )}
            />

            {/* Browser push */}
            <Tooltip
              title={
                pushPermission === "denied"
                  ? "Ai blocat notificările în browser. Activează-le din setările browserului și reîncarcă pagina."
                  : ""
              }
              placement="right"
            >
              <span>
                <FormControlLabel
                  control={
                    <Switch
                      checked={browserOn && pushSubscribed}
                      onChange={(_, c) => void handleBrowserToggle(c)}
                      disabled={
                        isSubmitting ||
                        pushLoading ||
                        pushPermission === "denied"
                      }
                      inputProps={{
                        "aria-describedby": "notif-browser-hint",
                      }}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} aria-hidden />
                      {pushLoading && (
                        <CircularProgress size={14} sx={{ mr: 0.5 }} />
                      )}
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Browser (Web Push)
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="span"
                          display="block"
                        >
                          Notificări push chiar și când browserul este în fundal.
                        </Typography>
                      </Box>
                    </Stack>
                  }
                  sx={{ alignItems: "flex-start", mx: 0, gap: 1, mb: 1 }}
                />
              </span>
            </Tooltip>
            {pushPermission === "denied" && (
              <Alert severity="warning" sx={{ mb: 2, maxWidth: 560 }} role="status">
                Notificările browser sunt blocate. Activează-le din setările browserului.
              </Alert>
            )}
            <FormHelperText id="notif-browser-hint" sx={{ mx: 0, mb: 2, maxWidth: 560 }}>
              Îți vom cere permisiunea la activare. Poți dezactiva oricând.
            </FormHelperText>

            {/* SMS — hidden until smsNotifications feature flag is enabled */}
            {smsNotifications && (
              <Controller
                name="notifications_sms"
                control={control}
                render={({ field }) => (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(_, c) => field.onChange(c)}
                          disabled={isSubmitting || !profile.phone}
                          inputProps={{
                            "aria-describedby": "notif-sms-hint",
                          }}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <PhoneAndroidOutlinedIcon sx={{ fontSize: 18 }} aria-hidden />
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={!profile.phone ? "text.disabled" : "text.primary"}
                            >
                              SMS
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="span"
                              display="block"
                            >
                              {profile.phone
                                ? "Notificări urgente prin mesaj text."
                                : "Adaugă un număr de telefon în profil pentru a activa."}
                            </Typography>
                          </Box>
                        </Stack>
                      }
                      sx={{ alignItems: "flex-start", mx: 0, gap: 1 }}
                    />
                    <FormHelperText id="notif-sms-hint" sx={{ mx: 0, mb: 2, maxWidth: 560 }}>
                      {!profile.phone
                        ? "Funcționalitate disponibilă după adăugarea numărului de telefon."
                        : "SMS-urile sunt trimise numai pentru notificări marcate ca urgente."}
                    </FormHelperText>
                  </>
                )}
              />
            )}
          </FormGroup>
        </fieldset>

        <Divider sx={{ my: 3 }} />

        {/* ── Per-type matrix ───────────────────────────────────────────────── */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
          Preferințe pe tip de notificare
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
          Bifează canalele dorite pentru fiecare tip de notificare. Canalele dezactivate global nu
          trimit notificări indiferent de setările de mai jos.
        </Typography>

        {NOTIFICATION_GROUPS.map((group) => (
          <Box
            key={group.label}
            component="fieldset"
            sx={{ border: "none", p: 0, m: 0, mb: 3 }}
          >
            <Typography
              component="legend"
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 0.8, mb: 1 }}
            >
              {group.label}
            </Typography>
            <TableContainer>
              <Table size="small" aria-label={group.label}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "60%", pl: 0, fontWeight: 700 }}>
                      Tip notificare
                    </TableCell>
                    {CHANNELS.map((ch) => (
                      <TableCell key={ch.key} align="center" sx={{ fontWeight: 700 }}>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          justifyContent="center"
                        >
                          {ch.icon}
                          <span>{ch.label}</span>
                        </Stack>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.types.map((typeKey) => {
                    const label = NOTIFICATION_TYPE_LABELS[typeKey] ?? typeKey;
                    const channelMasterOn: Record<NotificationChannel, boolean> = {
                      email: emailOn,
                      browser: browserOn,
                      sms: smsOn,
                    };
                    return (
                      <TableRow key={typeKey} hover>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ pl: 0, color: "text.secondary", fontSize: "0.8125rem" }}
                        >
                          {label}
                        </TableCell>
                        {CHANNELS.map((ch) => {
                          const fieldPath =
                            `preferences.${typeKey}.${ch.key}` as keyof NotificationPreferencesFormData;
                          const masterDisabled = !channelMasterOn[ch.key];
                          return (
                            <TableCell key={ch.key} align="center">
                              <Controller
                                name={`preferences.${typeKey}.${ch.key}` as Parameters<typeof control["register"]>[0]}
                                control={control}
                                render={({ field }) => (
                                  <Tooltip
                                    title={
                                      masterDisabled
                                        ? `Activează canalul ${ch.label} mai sus`
                                        : ""
                                    }
                                    placement="top"
                                  >
                                    <span>
                                      <Checkbox
                                        checked={Boolean(field.value) && !masterDisabled}
                                        onChange={(_, c) => field.onChange(c)}
                                        disabled={isSubmitting || masterDisabled}
                                        size="small"
                                        inputProps={{
                                          "aria-label": `${label} – ${ch.label}`,
                                        }}
                                      />
                                    </span>
                                  </Tooltip>
                                )}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}

        {errors.root && (
          <Alert severity="error" role="alert" sx={{ mb: 2 }}>
            {errors.root.message}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ minWidth: 160 }}
        >
          {isSubmitting ? "Se salvează…" : "Salvează preferințele"}
        </Button>
      </Box>
    </Paper>
  );
}
