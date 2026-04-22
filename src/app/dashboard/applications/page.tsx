"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import {
  archiveApplication,
  getUserApplications,
  withdrawApplication,
  type UserApplication,
} from "@/services/applications.service";
import {
  formatDate,
  jobTypeLabels,
  parseSupabaseError,
} from "@/lib/utils";
import type { Database, Json } from "@/types/database";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { WithdrawApplicationForm } from "@/components/forms/WithdrawApplicationForm";
import type { WithdrawApplicationFormData } from "@/components/forms/validations/withdraw-application.schema";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "În așteptare",
  reviewed: "Evaluată",
  shortlisted: "Preselectată",
  rejected: "Respinsă",
  withdrawn: "Închisă",
};

const STATUS_COLOR: Record<
  ApplicationStatus,
  "default" | "warning" | "info" | "success" | "error"
> = {
  pending: "warning",
  reviewed: "info",
  shortlisted: "success",
  rejected: "error",
  withdrawn: "default",
};

type ActionColor = "primary" | "secondary" | "warning" | "error";

interface ActionDef {
  key: string;
  label: string;
  icon: React.ReactElement;
  color: ActionColor;
  onClick: () => void;
  href?: string;
  external?: boolean;
}

interface ApplicationActionsProps {
  application: UserApplication;
  onWithdraw: (app: UserApplication) => void;
  onArchive: (app: UserApplication) => void;
}

const ApplicationActions: React.FC<ApplicationActionsProps> = ({
  application,
  onWithdraw,
  onArchive,
}) => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const job = application.job_listings;
  const company = job?.companies ?? null;
  const canWithdraw = application.status !== "withdrawn";

  const actions: ActionDef[] = [
    job?.slug
      ? {
          key: "view-job",
          label: "Vezi anunțul",
          color: "primary" as ActionColor,
          icon: <OpenInNewIcon fontSize="small" />,
          onClick: () => {},
          href: `/jobs/${job.slug}`,
        }
      : null,
    company?.slug
      ? {
          key: "view-company",
          label: "Vezi compania",
          color: "secondary" as ActionColor,
          icon: <BusinessOutlinedIcon fontSize="small" />,
          onClick: () => {},
          href: `/companies/${company.slug}`,
        }
      : null,
    canWithdraw
      ? {
          key: "withdraw",
          label: "Retrage aplicația",
          color: "warning" as ActionColor,
          icon: <BlockOutlinedIcon fontSize="small" />,
          onClick: () => onWithdraw(application),
        }
      : null,
    {
      key: "archive",
      label: "Arhivează",
      color: "error" as ActionColor,
      icon: <DeleteOutlineIcon fontSize="small" />,
      onClick: () => onArchive(application),
    },
  ].filter((a): a is ActionDef => a !== null);

  const visibleCount = isMd ? 2 : 1;
  const visible = actions.slice(0, visibleCount);
  const overflow = actions.slice(visibleCount);
  const [primary, ...rest] = visible;

  const renderButton = (action: ActionDef, variant: "contained" | "outlined") => {
    const buttonProps = action.href
      ? { component: Link, href: action.href }
      : { onClick: action.onClick };
    return (
      <Button
        {...buttonProps}
        size="small"
        variant={variant}
        color={action.color}
        startIcon={isSm ? action.icon : undefined}
        sx={{
          minWidth: 0,
          px: isSm ? 1.5 : 1,
          fontWeight: variant === "contained" ? 600 : 500,
          whiteSpace: "nowrap",
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        }}
      >
        {isSm ? action.label : action.icon}
      </Button>
    );
  };

  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      onClick={(e) => e.stopPropagation()}
    >
      {primary && (
        <Tooltip title={!isSm ? primary.label : ""}>
          {renderButton(primary, "contained")}
        </Tooltip>
      )}

      {rest.map((action) => (
        <Box key={action.key}>{renderButton(action, "outlined")}</Box>
      ))}

      {overflow.length > 0 && (
        <>
          <Tooltip title="Mai multe acțiuni">
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              aria-label="Mai multe acțiuni pentru această aplicație"
              sx={{ color: "text.secondary" }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: { sx: { minWidth: 180, borderRadius: 2, mt: 0.5 } },
            }}
          >
            {overflow.map((action) => {
              const itemProps = action.href
                ? { component: Link, href: action.href }
                : {};
              return (
                <MenuItem
                  key={action.key}
                  {...itemProps}
                  onClick={() => {
                    action.onClick();
                    setMenuAnchor(null);
                  }}
                  sx={{ gap: 1.5, py: 1 }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 0, color: `${action.color}.main` }}
                  >
                    {action.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={action.label}
                    primaryTypographyProps={{
                      variant: "body2",
                      color: `${action.color}.main`,
                      fontWeight: 500,
                    }}
                  />
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}
    </Stack>
  );
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [withdrawTarget, setWithdrawTarget] = useState<UserApplication | null>(
    null
  );
  const [archiveTarget, setArchiveTarget] = useState<UserApplication | null>(
    null
  );
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    severity: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserApplications(supabase, user.id);
      setApplications(data);
    } catch (err) {
      setFeedback({ severity: "error", text: parseSupabaseError(err) });
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const formDataEntries = (raw: Json | null): [string, string][] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    return Object.entries(raw as Record<string, unknown>).map(([k, v]) => [
      k,
      String(v ?? ""),
    ]);
  };

  const notifyPoster = async (
    applicationId: string,
    reason: string
  ): Promise<void> => {
    try {
      await supabase.functions.invoke("application-withdrawn", {
        body: { application_id: applicationId, reason },
      });
    } catch (err) {
      console.warn("application-withdrawn:", err);
    }
  };

  const handleWithdrawSubmit = async ({
    reason,
  }: WithdrawApplicationFormData): Promise<void> => {
    if (!withdrawTarget) return;
    try {
      await withdrawApplication(supabase, withdrawTarget.id, reason);
      await notifyPoster(withdrawTarget.id, reason);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === withdrawTarget.id
            ? {
                ...a,
                status: "withdrawn",
                withdraw_reason: reason,
                withdrawn_at: new Date().toISOString(),
              }
            : a
        )
      );
      setFeedback({
        severity: "success",
        text: "Aplicația a fost retrasă și angajatorul a fost notificat.",
      });
      setWithdrawTarget(null);
    } catch (err) {
      setFeedback({ severity: "error", text: parseSupabaseError(err) });
    }
  };

  const handleConfirmArchive = async (): Promise<void> => {
    if (!archiveTarget) return;
    setArchiveBusy(true);
    try {
      if (archiveTarget.status !== "withdrawn") {
        const reason =
          "Aplicația a fost retrasă și arhivată de candidat din tabloul de bord.";
        await withdrawApplication(supabase, archiveTarget.id, reason);
        await notifyPoster(archiveTarget.id, reason);
      }
      await archiveApplication(supabase, archiveTarget.id);
      setApplications((prev) => prev.filter((a) => a.id !== archiveTarget.id));
      setFeedback({
        severity: "success",
        text: "Aplicația a fost ștearsă din lista ta.",
      });
      setArchiveTarget(null);
    } catch (err) {
      setFeedback({ severity: "error", text: parseSupabaseError(err) });
    } finally {
      setArchiveBusy(false);
    }
  };

  return (
    <>
      <DashboardPageHeader
        title={
          <Typography variant="h5" fontWeight={700}>
            Aplicațiile mele
          </Typography>
        }
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Toate candidaturile trimise de tine.
          </Typography>
        }
      />

      {loading && (
        <Stack spacing={1.5}>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={80}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Stack>
      )}

      {!loading && applications.length === 0 && (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <SendOutlinedIcon
            sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }}
          />
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Nicio aplicație
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nu ai trimis nicio candidatură încă. Răsfoiește locurile de muncă
            disponibile.
          </Typography>
          <Button
            component={Link}
            href="/jobs"
            variant="contained"
            color="primary"
            size="large"
            startIcon={<WorkOutlineIcon />}
            sx={{ mt: 2.5, minHeight: 44 }}
          >
            Vezi locuri de muncă
          </Button>
        </Paper>
      )}

      {!loading && applications.length > 0 && (
        <Stack spacing={1.5}>
          {applications.map((app) => {
            const job = app.job_listings;
            const isExpanded = expanded.has(app.id);
            const entries = formDataEntries(app.form_data);
            const hasDetails =
              entries.length > 0 ||
              (app.status === "withdrawn" && app.withdraw_reason);

            return (
              <Paper
                key={app.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  spacing={{ xs: 1.5, sm: 2 }}
                  sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    cursor: hasDetails ? "pointer" : "default",
                  }}
                  onClick={() => hasDetails && toggle(app.id)}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    <WorkOutlineIcon
                      sx={{ color: "text.secondary", flexShrink: 0 }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {job ? (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Typography
                            component={Link}
                            href={`/jobs/${job.slug}`}
                            variant="subtitle2"
                            fontWeight={700}
                            noWrap
                            sx={{
                              textDecoration: "none",
                              color: "text.primary",
                              "&:hover": { color: "primary.main" },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {job.title}
                          </Typography>
                          {job.job_type && (
                            <Chip
                              label={
                                jobTypeLabels[job.job_type] ?? job.job_type
                              }
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      ) : (
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          color="text.secondary"
                        >
                          Loc de muncă șters
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {job?.companies?.name ?? "—"} •{" "}
                        {formatDate(app.applied_at)}
                        {job?.location ? ` • ${job.location}` : ""}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      flexShrink: 0,
                      justifyContent: { xs: "space-between", sm: "flex-end" },
                    }}
                  >
                    <Chip
                      label={STATUS_LABEL[app.status]}
                      size="small"
                      color={STATUS_COLOR[app.status]}
                      sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                    />
                    <ApplicationActions
                      application={app}
                      onWithdraw={setWithdrawTarget}
                      onArchive={setArchiveTarget}
                    />
                    {hasDetails && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(app.id);
                        }}
                        aria-label={
                          isExpanded
                            ? "Ascunde detaliile aplicației"
                            : "Afișează detaliile aplicației"
                        }
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ExpandLessIcon fontSize="small" />
                        ) : (
                          <ExpandMoreIcon fontSize="small" />
                        )}
                      </IconButton>
                    )}
                  </Stack>
                </Stack>

                {hasDetails && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box
                      sx={{
                        px: 3,
                        pb: 2.5,
                        pt: 0.5,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        bgcolor: "action.hover",
                      }}
                    >
                      {app.status === "withdrawn" && app.withdraw_reason && (
                        <Box sx={{ mb: entries.length > 0 ? 2 : 0, mt: 1 }}>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="text.secondary"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            Motiv retragere
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ whiteSpace: "pre-wrap", fontWeight: 500 }}
                          >
                            {app.withdraw_reason}
                          </Typography>
                        </Box>
                      )}

                      {entries.length > 0 && (
                        <>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="text.secondary"
                            sx={{ display: "block", mb: 0.5, mt: 1 }}
                          >
                            Răspunsuri formular
                          </Typography>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "1fr 1fr",
                                md: "1fr 1fr 1fr",
                              },
                              gap: 1.5,
                            }}
                          >
                            {entries.map(([label, value]) => {
                              const tags = value.includes("|||")
                                ? value
                                    .split("|||")
                                    .map((t) => t.trim())
                                    .filter(Boolean)
                                : [];
                              return (
                                <Box key={label}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: "block",
                                      mb: tags.length > 0 ? 0.5 : 0,
                                    }}
                                  >
                                    {label}
                                  </Typography>
                                  {tags.length > 0 ? (
                                    <Stack
                                      direction="row"
                                      flexWrap="wrap"
                                      gap={0.5}
                                    >
                                      {tags.map((tag) => (
                                        <Chip
                                          key={tag}
                                          label={tag}
                                          size="small"
                                          variant="outlined"
                                        />
                                      ))}
                                    </Stack>
                                  ) : (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        wordBreak: "break-word",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {value || "—"}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        </>
                      )}
                    </Box>
                  </Collapse>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}

      <WithdrawApplicationForm
        open={withdrawTarget !== null}
        jobTitle={withdrawTarget?.job_listings?.title ?? null}
        onClose={() => setWithdrawTarget(null)}
        onSubmit={handleWithdrawSubmit}
      />

      <Dialog
        open={archiveTarget !== null}
        onClose={() => (archiveBusy ? undefined : setArchiveTarget(null))}
        aria-labelledby="archive-dialog-title"
        aria-describedby="archive-dialog-description"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="archive-dialog-title" sx={{ fontWeight: 700, pb: 1 }}>
          Ștergi aplicația?
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            id="archive-dialog-description"
            sx={{ color: "text.primary" }}
          >
            Această acțiune va șterge aplicația ta
            {archiveTarget?.job_listings?.title ? (
              <>
                {" "}pentru{" "}
                <Typography component="span" fontWeight={700}>
                  {archiveTarget.job_listings.title}
                </Typography>
              </>
            ) : null}
            . Dacă aplicația este încă activă, va fi și retrasă, iar angajatorul
            va fi notificat. Ești sigur?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setArchiveTarget(null)}
            disabled={archiveBusy}
          >
            Anulează
          </Button>
          <Button
            onClick={() => void handleConfirmArchive()}
            variant="contained"
            color="error"
            disabled={archiveBusy}
          >
            {archiveBusy ? "Se șterge…" : "Da, șterge"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback !== null}
        autoHideDuration={5000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {feedback ? (
          <Alert
            severity={feedback.severity}
            onClose={() => setFeedback(null)}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {feedback.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
