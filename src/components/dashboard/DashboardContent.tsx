"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
  LinearProgress,
  Avatar,
} from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SendIcon from "@mui/icons-material/Send";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import BookmarkOutlinedIcon from "@mui/icons-material/BookmarkOutlined";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TouchAppOutlinedIcon from "@mui/icons-material/TouchAppOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import { useRole } from "@/hooks/useRole";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import appSettings from "@/config/app.settings.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  profileName: string | null;
  profileComplete: boolean;

  // Profile completeness breakdown (for progress steps)
  profileHasAvatar: boolean;
  profileHasBio: boolean;
  profileHasExperience: boolean;
  profileHasEducation: boolean;
  profileHasSkills: boolean;

  publishedJobs: number;
  draftJobs: number;
  applicationsReceived: number;
  applicationsSent: number;
  savedCompanies: number;
  formsTotal: number;
  formResponsesTotal: number;

  hasCompanies: boolean;
  companyVisits?: number;
  companyEngages?: number;

  // Milestone flags
  hasAlerts: boolean;
  hasRejectedCandidate: boolean;
  hasShortlistedCandidate: boolean;
  hasArchived: boolean;

  activityByMonth: { month: string; sent: number; received: number }[];
  jobsByStatus: { name: string; value: number }[];
  applicationsByStatus: { name: string; value: number }[];
  formResponsesByMonth: { month: string; count: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  primary: "#03170C",
  secondary: "#3E5C76",
  secondaryLight: "#748CAB",
  // #7a6420 on white = ~5.2:1 — passes WCAG AA for normal text and icons
  gold: "#7a6420",
  // Gold on dark hero background — lighter variant so it reads on #03170C
  goldOnDark: "#e0c96a",
  soft: "#F0EBD8",
  danger: "#c62828",
  success: "#2d6a4f",
  bg: "#f6f8f5",
};

// Pie chart colours — used only as decorative swatch fills (min 3:1 for non-text).
// Legend caption text always renders in text.primary, so fill contrast rules are relaxed.
const PIE_JOB = [C.primary, C.gold, "#5a7a96"];
const PIE_APP = ["#5a7a96", C.secondary, C.gold, C.primary, C.danger];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ px: 1.5, py: 1, border: "1px solid rgba(3, 23, 12, 0.1)", boxShadow: 3, minWidth: 120 }}>
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          {label}
        </Typography>
      )}
      {payload.map((p) => (
        <Stack key={p.name} direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color, flexShrink: 0 }} />
          <Typography variant="caption">
            {p.name}: <strong>{p.value}</strong>
          </Typography>
        </Stack>
      ))}
    </Paper>
  );
};

const PieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ px: 1.5, py: 1, border: "1px solid rgba(3, 23, 12, 0.1)", boxShadow: 3 }}>
      <Typography variant="caption">
        {payload[0].name}: <strong>{payload[0].value}</strong>
      </Typography>
    </Paper>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  href?: string;
  sublabel?: string;
}

function StatCard({ label, value, icon, accentColor, href, sublabel }: StatCardProps) {
  return (
    <Paper
      component={href ? Link : "div"}
      href={href}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px solid rgba(3, 23, 12, 0.1)",
        borderLeft: `4px solid ${accentColor}`,
        textDecoration: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
        cursor: href ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 2,
        "&:hover": href
          ? { borderColor: "rgba(62, 92, 118, 0.35)", boxShadow: "0 4px 20px rgba(3, 23, 12, 0.08)", transform: "translateY(-1px)" }
          : {},
      }}
    >
      <Avatar
        sx={{
          bgcolor: `${accentColor}18`,
          color: accentColor,
          width: 44,
          height: 44,
          flexShrink: 0,
        }}
      >
        {icon}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: accentColor, lineHeight: 1, fontSize: "1.6rem" }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontWeight: 500 }}>
          {label}
        </Typography>
        {sublabel && (
          <Typography variant="caption" color="text.secondary">
            {sublabel}
          </Typography>
        )}
      </Box>
      {href && (
        <ArrowForwardIcon sx={{ ml: "auto", color: "text.disabled", fontSize: 16, flexShrink: 0 }} />
      )}
    </Paper>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {icon && <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>}
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          {title}
        </Typography>
      </Stack>
      {action}
    </Stack>
  );
}

// ─── Chart wrapper ────────────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  children,
  empty,
  emptyLabel,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  empty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <Paper sx={{ p: 3, border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          {subtitle}
        </Typography>
      )}
      {!subtitle && <Box sx={{ mb: 2 }} />}
      {empty ? (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
          <Typography variant="body2" color="text.disabled">
            {emptyLabel ?? "Nu există date"}
          </Typography>
        </Box>
      ) : (
        children
      )}
    </Paper>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

// All colors are chosen for WCAG AA contrast on the dark hero (#03170C→#3E5C76).
interface ProfileProgressProps {
  profileHasAvatar: boolean;
  profileHasBio: boolean;
  profileHasExperience: boolean;
  profileHasEducation: boolean;
  profileHasSkills: boolean;
  hasAlerts: boolean;
  applicationsSent: number;
  hasCompanies: boolean;
  formsTotal: number;
  publishedJobs: number;
  draftJobs: number;
  applicationsReceived: number;
  hasRejectedCandidate: boolean;
  hasShortlistedCandidate: boolean;
  hasArchived: boolean;
  /** Role flags forwarded from useRole() in the parent. */
  isAtLeastEmployer: boolean;
  isAdmin: boolean;
}

function ProfileProgress({
  profileHasAvatar,
  profileHasBio,
  profileHasExperience,
  profileHasEducation,
  profileHasSkills,
  hasAlerts,
  applicationsSent,
  hasCompanies,
  formsTotal,
  publishedJobs,
  draftJobs,
  applicationsReceived,
  hasRejectedCandidate,
  hasShortlistedCandidate,
  hasArchived,
  isAtLeastEmployer,
  isAdmin,
}: ProfileProgressProps) {
  type Step = { visibleLabel: string; visible: boolean; label: string; weight: number; done: boolean };

  // ── User role steps (weights sum to 40 → normalised to 100%) ──────────────
  const userSteps: Step[] = [
    { visibleLabel: "Cont creat",            visible: true,  label: "Cont creat",             weight: 5,  done: true },
    { visibleLabel: "Profil",                visible: true,  label: "Profil, bio & experiență", weight: 10, done: profileHasAvatar && profileHasBio && profileHasExperience },
    { visibleLabel: "Profil — educație",     visible: false, label: "Profil — educație",       weight: 5,  done: profileHasEducation },
    { visibleLabel: "Profil — experiență",   visible: false, label: "Profil — experiență",     weight: 5,  done: profileHasExperience },
    { visibleLabel: "Profil — competențe",   visible: false, label: "Profil — competențe",     weight: 5,  done: profileHasSkills },
    { visibleLabel: "Alertă",               visible: true,  label: "Prima alertă",            weight: 5,  done: hasAlerts },
    { visibleLabel: "Aplicat la un anunț",  visible: true,  label: "Aplicat la un anunț",     weight: 5,  done: applicationsSent > 0 },
  ];

  // ── Employer / premium_employer / admin steps (weights sum to 60 → normalised to 100%) ──
  const employerSteps: Step[] = [
    { visibleLabel: "Companie",                  visible: true,  label: "Companie creată",          weight: 5,  done: hasCompanies },
    { visibleLabel: "Formular",                  visible: true,  label: "Formular creat",            weight: 10, done: formsTotal > 0 },
    { visibleLabel: "Anunțuri",                  visible: true,  label: "Anunț creat",               weight: 10, done: publishedJobs + draftJobs > 0 },
    { visibleLabel: "Primul candidat aplicat",   visible: false, label: "Primul candidat aplicat",   weight: 10, done: applicationsReceived > 0 },
    { visibleLabel: "Primul candidat respins",   visible: false, label: "Primul candidat respins",   weight: 10, done: hasRejectedCandidate },
    { visibleLabel: "Candidați",                 visible: true,  label: "Candidat acceptat",         weight: 10, done: hasShortlistedCandidate },
    { visibleLabel: "Arhivare",                  visible: true,  label: "Arhivare",                  weight: 5,  done: hasArchived },
  ];

  // Admins share the employer progress track
  const steps = isAtLeastEmployer || isAdmin ? employerSteps : userSteps;

  // Percentage normalises automatically: earnedWeight / totalWeight * 100
  // so each group independently reaches 100% regardless of raw weight totals.
  const totalWeight = steps.reduce((s, x) => s + x.weight, 0);
  const earnedWeight = steps.filter((x) => x.done).reduce((s, x) => s + x.weight, 0);
  const pct = Math.round((earnedWeight / totalWeight) * 100);

  const complete = pct === 100;
  // const barColor = complete ? "#6fcf97" : C.goldOnDark;
  const barColor = "#6fcf97";
  const pctColor = barColor;

  const pendingSteps = steps.filter((s) => !s.done);

  return (
    <Box>
      {/* Bar + label row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="caption" sx={{ color: `${C.soft}aa` }}>
          Progres cont
        </Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color: pctColor }}>
          {pct}%
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label={`Progres cont: ${pct}%`}
        sx={{
          height: 6,
          borderRadius: 4,
          bgcolor: `${C.soft}22`,
          "& .MuiLinearProgress-bar": { bgcolor: barColor, borderRadius: 4 },
        }}
      />

      {/* Step dots — all 14 in two wrapped rows */}
      <Box
        sx={{
          mt: 1.25,
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 16px",
        }}
      >
        {steps.filter((s) => s.visible).map((s) => (
          <Stack key={s.label} direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: s.done ? barColor : `${C.soft}33`,
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            <Typography
              variant="caption"
              sx={{
                color: s.done ? C.soft : `${C.soft}55`,
                fontSize: "0.65rem",
                lineHeight: 1.2,
                textDecoration: s.done ? "none" : "none",
              }}
            >
              {s.visibleLabel}
            </Typography>
          </Stack>
        ))}
      </Box>

      {/* Next step hint */}
      {/* {pendingSteps.length > 0 && !complete && (
        <Typography
          variant="caption"
          sx={{ color: `${C.soft}77`, display: "block", mt: 1, fontSize: "0.68rem" }}
        >
          Urmează: {pendingSteps.slice(0, 2).map((s) => s.label).join(", ")}
          {pendingSteps.length > 2 ? ` și ${pendingSteps.length - 2} altele` : ""}
        </Typography>
      )} */}
    </Box>
  );
}

// ─── Quick action card ────────────────────────────────────────────────────────

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  color: string;
  label: string;
  sublabel: string;
  /** Render with a dashed warning border (e.g. incomplete profile). */
  warn?: boolean;
}

function QuickAction({ href, icon, color, label, sublabel, warn = false }: QuickActionProps) {
  return (
    <Paper
      component={Link}
      href={href}
      sx={{
        p: 2,
        border: warn ? "1px dashed #a0882a" : "1px solid rgba(3, 23, 12, 0.1)",
        bgcolor: warn ? "#fdf6e3" : "background.paper",
        borderRadius: 2,
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": warn
          ? { boxShadow: "0 4px 20px rgba(3, 23, 12, 0.08)" }
          : { borderColor: "rgba(62, 92, 118, 0.35)", boxShadow: "0 4px 20px rgba(3, 23, 12, 0.08)" },
      }}
    >
      <Avatar
        sx={{
          bgcolor: warn ? "#f5e6a3" : `${color}18`,
          color: warn ? "#6b560a" : color,
          width: 36,
          height: 36,
          flexShrink: 0,
        }}
      >
        {icon}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ color: warn ? "#6b560a" : "text.primary" }}
          noWrap
        >
          {label}
        </Typography>
        <Typography variant="caption" color={warn ? "text.secondary" : "text.secondary"} noWrap>
          {sublabel}
        </Typography>
      </Box>
    </Paper>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DashboardContent({
  profileName,
  profileComplete,
  profileHasAvatar,
  profileHasBio,
  profileHasExperience,
  profileHasEducation,
  profileHasSkills,
  publishedJobs,
  draftJobs,
  applicationsReceived,
  applicationsSent,
  savedCompanies,
  formsTotal,
  formResponsesTotal,
  hasCompanies,
  companyVisits,
  companyEngages,
  hasAlerts,
  hasRejectedCandidate,
  hasShortlistedCandidate,
  hasArchived,
  activityByMonth,
  jobsByStatus,
  applicationsByStatus,
  formResponsesByMonth,
}: DashboardStats) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { isAtLeastEmployer, isAdmin } = useRole();

  const formsEnabled = appSettings.features.forms;
  const favEnabled = appSettings.features.favourites;

  // Role-based widget visibility
  // showCandidateWidgets: user role + admin (admin sees everything)
  // showEmployerWidgets:  employer / premium_employer / admin (isAtLeastEmployer already includes admin)
  const showCandidateWidgets = !isAtLeastEmployer || isAdmin;
  const showEmployerWidgets = isAtLeastEmployer;

  const hasActivity = activityByMonth.some((m) => m.sent > 0 || m.received > 0);
  const hasJobStatus = jobsByStatus.some((s) => s.value > 0);
  const hasAppStatus = applicationsByStatus.some((s) => s.value > 0);
  const hasFormResponses = formResponsesByMonth.some((m) => m.count > 0);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bună dimineața" : hour < 18 ? "Bună ziua" : "Bună seara";

  return (
    <Stack spacing={4}>

      {/* ── Hero Welcome ──────────────────────────────────────────────────── */}
      <Paper
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          border: "1px solid rgba(3, 23, 12, 0.1)",
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
          color: C.soft,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative ring */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: `40px solid ${C.gold}22`,
            pointerEvents: "none",
          }}
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: C.soft, mb: 0.5 }}>
              {greeting}{profileName ? `, ${profileName}` : ""}!
            </Typography>
            <Typography variant="body2" sx={{ color: `${C.soft}aa` }}>
              {hasCompanies
                ? `Ai ${publishedJobs} anunț${publishedJobs === 1 ? "" : "uri"} activ${publishedJobs === 1 ? "" : "e"} și ${applicationsReceived} aplicație${applicationsReceived === 1 ? "" : " primite"}.`
                : applicationsSent > 0
                ? `Ai trimis ${applicationsSent} aplicație${applicationsSent === 1 ? "" : " până acum"}. Continuă!`
                : "Explorează locuri de muncă și aplică la joburile potrivite."}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexShrink={0} flexWrap="wrap">
            {hasCompanies ? (
              <Button
                component={Link}
                href="/dashboard/jobs/new"
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                sx={{ bgcolor: C.goldOnDark, color: C.soft, fontWeight: 700, "&:hover": { bgcolor: "#c9b24e" } }}
              >
                Anunț nou
              </Button>
            ) : (
              <Button
                component={Link}
                href="/jobs"
                variant="contained"
                size="small"
                startIcon={<SearchIcon />}
                sx={{ bgcolor: C.goldOnDark, color: C.primary, fontWeight: 700, "&:hover": { bgcolor: "#c9b24e" } }}
              >
                Caută joburi
              </Button>
            )}
            <Button
              component={Link}
              href="/dashboard/applications"
              variant="outlined"
              size="small"
              sx={{ borderColor: `${C.soft}55`, color: C.soft, "&:hover": { borderColor: C.soft, bgcolor: `${C.soft}11` } }}
            >
              Aplicațiile mele
            </Button>
          </Stack>
        </Stack>

        {/* Profile progress bar inside hero */}
        <Box sx={{ mt: 2.5, pt: 2.5, borderTop: `1px solid ${C.soft}22` }}>
          <ProfileProgress
            profileHasAvatar={profileHasAvatar}
            profileHasBio={profileHasBio}
            profileHasExperience={profileHasExperience}
            profileHasEducation={profileHasEducation}
            profileHasSkills={profileHasSkills}
            hasAlerts={hasAlerts}
            applicationsSent={applicationsSent}
            hasCompanies={hasCompanies}
            formsTotal={formsTotal}
            publishedJobs={publishedJobs}
            draftJobs={draftJobs}
            applicationsReceived={applicationsReceived}
            hasRejectedCandidate={hasRejectedCandidate}
            hasShortlistedCandidate={hasShortlistedCandidate}
            hasArchived={hasArchived}
            isAtLeastEmployer={isAtLeastEmployer}
            isAdmin={isAdmin}
          />
          {!profileComplete && (
            <Button
              component={Link}
              href="/dashboard/profile"
              size="small"
              startIcon={<PersonOutlineIcon />}
              sx={{ mt: 1.5, color: C.goldOnDark, fontWeight: 600, pl: 0, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}
            >
              Completează profilul tău
            </Button>
          )}
        </Box>
      </Paper>

      {/* ── Job-seeker stats — user + admin ──────────────────────────────── */}
      {showCandidateWidgets && <Box>
        <SectionHeader
          title="Activitatea ta ca și candidat"
          icon={<SendIcon fontSize="small" />}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          <StatCard
            label="Aplicații trimise"
            value={applicationsSent}
            icon={<SendIcon fontSize="small" />}
            accentColor={C.secondary}
            href="/dashboard/applications"
            sublabel="Total candidaturi"
          />
          <StatCard
            label="Aplicatii active"
            value={applicationsByStatus.find((s) => s.name === "În așteptare")?.value ?? applicationsSent}
            icon={<TrendingUpIcon fontSize="small" />}
            accentColor={C.gold}
            href="/dashboard/applications"
            sublabel="Urmărește progresul"
          />
          {favEnabled && (
            <StatCard
              label="Companii salvate"
              value={savedCompanies}
              icon={<BookmarkOutlinedIcon fontSize="small" />}
              accentColor={C.secondary}
              sublabel="În lista ta de urmărire"
            />
          )}
        </Box>
      </Box>}

      {/* ── Employer stats — employer / premium_employer / admin ──────────── */}
      {showEmployerWidgets && (
        <Box>
          <SectionHeader
            title="Activitatea ta ca și angajator"
            icon={<BusinessCenterOutlinedIcon fontSize="small" />}
            action={
              <Button
                component={Link}
                href="/dashboard/jobs"
                endIcon={<ArrowForwardIcon />}
                size="small"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Vezi toate
              </Button>
            }
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            <StatCard
              label="Anunțuri active"
              value={publishedJobs}
              icon={<WorkOutlineIcon fontSize="small" />}
              accentColor={C.primary}
              href="/dashboard/jobs"
              sublabel="Vizibile"
            />
            <StatCard
              label="Anunțuri ciornă"
              value={draftJobs}
              icon={<EditNoteIcon fontSize="small" />}
              accentColor={C.gold}
              href="/dashboard/jobs"
              sublabel="Nepublicate"
            />
            <StatCard
              label="Aplicații primite"
              value={applicationsReceived}
              icon={<InboxOutlinedIcon fontSize="small" />}
              accentColor={C.secondary}
              href="/dashboard/jobs"
              sublabel="Candidați"
            />
          </Box>

          {/* Company engagement secondary row */}
          {(typeof companyEngages === "number" || (formsEnabled && formsTotal > 0)) && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
                gap: 2,
                mt: 2,
              }}
            >
              {typeof companyEngages === "number" && (
                <StatCard
                  label="Vizite"
                  value={companyVisits ?? 0}
                  icon={<VisibilityOutlinedIcon fontSize="small" />}
                  accentColor={C.gold}
                  sublabel="Pe profilul companiei"
                />
              )}
              {typeof companyEngages === "number" && (
                <StatCard
                  label="Interacțiuni"
                  value={companyEngages}
                  icon={<TouchAppOutlinedIcon fontSize="small" />}
                  accentColor={C.gold}
                  sublabel="Totale ale companiei"
                />
              )}
              {formsEnabled && (
                <StatCard
                  label="Formulare"
                  value={formsTotal}
                  icon={<ArticleOutlinedIcon fontSize="small" />}
                  accentColor={C.secondary}
                  href="/dashboard/forms"
                  sublabel="Total create"
                />
              )}
              {formsEnabled && (
                <StatCard
                  label="Răspunsuri"
                  value={formResponsesTotal}
                  icon={<InboxOutlinedIcon fontSize="small" />}
                  accentColor={C.primary}
                  href="/dashboard/forms"
                  sublabel="La formulare"
                />
              )}
            </Box>
          )}
        </Box>
      )}

      {/* ── Activity charts ───────────────────────────────────────────────── */}
      <Box>
        <SectionHeader title="Activitate — ultimele 6 luni" icon={<TrendingUpIcon fontSize="small" />} />
        <Stack spacing={2}>
          <ChartCard
            title="Aplicații trimise vs. primite"
            subtitle="Evoluția lunară a candidaturilor"
            empty={!hasActivity}
            emptyLabel="Nicio activitate în ultimele 6 luni"
          >
            <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
              {showCandidateWidgets && (
                <Chip
                  size="small"
                  label="Trimise"
                  sx={{ bgcolor: C.gold, color: "#ffffff", fontWeight: 600 }}
                />
              )}
              {showEmployerWidgets && (
                <Chip
                  size="small"
                  label="Primite"
                  sx={{ bgcolor: C.primary, color: "#fff", fontWeight: 600 }}
                />
              )}
            </Stack>
            {mounted ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activityByMonth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.gold} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.primary} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {showCandidateWidgets && (
                    <Area
                      type="monotone"
                      dataKey="sent"
                      name="Trimise"
                      stroke={C.gold}
                      strokeWidth={2}
                      fill="url(#gradSent)"
                      dot={{ r: 3 }}
                    />
                  )}
                  {showEmployerWidgets && (
                    <Area
                      type="monotone"
                      dataKey="received"
                      name="Primite"
                      stroke={C.primary}
                      strokeWidth={2}
                      fill="url(#gradReceived)"
                      dot={{ r: 3 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton variant="rounded" height={200} />
            )}
          </ChartCard>

          {/* Status pie charts */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                // two columns only when both employer and candidate pies are visible (admin)
                sm: showEmployerWidgets && showCandidateWidgets ? "1fr 1fr" : "1fr",
              },
              gap: 2,
            }}
          >
            {showEmployerWidgets && (
              <ChartCard
                title="Anunțuri după status"
                subtitle="Distribuția posturilor tale"
                empty={!hasJobStatus}
                emptyLabel="Niciun anunț creat"
              >
                {mounted ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <ResponsiveContainer width="55%" height={150}>
                      <PieChart>
                        <Pie
                          data={jobsByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {jobsByStatus.map((entry, i) => (
                            <Cell key={entry.name} fill={PIE_JOB[i % PIE_JOB.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Stack spacing={0.75} sx={{ flex: 1 }}>
                      {jobsByStatus.map((s, i) => (
                        <Stack key={s.name} direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: 1,
                              bgcolor: PIE_JOB[i % PIE_JOB.length],
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="caption" sx={{ flex: 1 }}>
                            {s.name}
                          </Typography>
                          <Typography variant="caption" fontWeight={700}>
                            {s.value}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Skeleton variant="rounded" height={150} />
                )}
              </ChartCard>
            )}

            {showCandidateWidgets && <ChartCard
              title="Aplicații trimise după status"
              subtitle="Statusul candidaturilor tale"
              empty={!hasAppStatus}
              emptyLabel="Nicio aplicație trimisă"
            >
              {mounted ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <ResponsiveContainer width="55%" height={150}>
                    <PieChart>
                      <Pie
                        data={applicationsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {applicationsByStatus.map((entry, i) => (
                          <Cell key={entry.name} fill={PIE_APP[i % PIE_APP.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={0.75} sx={{ flex: 1 }}>
                    {applicationsByStatus.map((s, i) => (
                      <Stack key={s.name} direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: 1,
                            bgcolor: PIE_APP[i % PIE_APP.length],
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="caption" sx={{ flex: 1 }}>
                          {s.name}
                        </Typography>
                        <Typography variant="caption" fontWeight={700}>
                          {s.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Skeleton variant="rounded" height={150} />
              )}
            </ChartCard>}
          </Box>

          {/* Form responses bar chart */}
          {formsEnabled && showEmployerWidgets && (
            <ChartCard
              title="Răspunsuri formulare"
              subtitle="Numărul de răspunsuri primite lunar"
              empty={!hasFormResponses}
              emptyLabel="Niciun răspuns în ultimele 6 luni"
            >
              {mounted ? (
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart
                    data={formResponsesByMonth}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      name="Răspunsuri"
                      fill={C.secondary}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton variant="rounded" height={170} />
              )}
            </ChartCard>
          )}
        </Stack>
      </Box>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <Box>
        <SectionHeader title="Acțiuni rapide" />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 1.5,
          }}
        >
          {/* ── Always visible ── */}
          <QuickAction
            href="/jobs"
            icon={<SearchIcon fontSize="small" />}
            color={C.secondary}
            label="Caută joburi"
            sublabel="Explorează ofertele disponibile"
          />

          <QuickAction
            href="/dashboard/profile"
            icon={<PersonOutlineIcon fontSize="small" />}
            color={C.secondary}
            label="Profilul meu"
            sublabel={profileComplete ? "Profil complet" : "Completează profilul"}
            warn={!profileComplete}
          />

          <QuickAction
            href="/dashboard/applications"
            icon={<SendIcon fontSize="small" />}
            color={C.gold}
            label="Aplicațiile mele"
            sublabel={`${applicationsSent} ${applicationsSent === 1 ? "candidatură" : "candidaturi"} trimise`}
          />

          {/* ── Favourites ── */}
          {favEnabled && (
            <QuickAction
              href="/dashboard/favourites"
              icon={<BookmarkOutlinedIcon fontSize="small" />}
              color={C.gold}
              label="Favorite"
              sublabel="Joburi și companii salvate"
            />
          )}

          {/* ── Archive (visible once user has archived something) ── */}
          {hasArchived && (
            <QuickAction
              href="/dashboard/archive"
              icon={<InventoryOutlinedIcon fontSize="small" />}
              color={C.secondaryLight}
              label="Arhivă"
              sublabel="Elemente arhivate"
            />
          )}

          {/* ── Employer: add new job listing ── */}
          {isAtLeastEmployer && hasCompanies && (
            <QuickAction
              href="/dashboard/jobs"
              icon={<AddIcon fontSize="small" />}
              color={C.primary}
              label="Anunț nou"
              sublabel="Publică un loc de muncă"
            />
          )}

          {/* ── Employer: no company yet — prompt to create one ── */}
          {isAtLeastEmployer && !hasCompanies && (
            <QuickAction
              href="/dashboard/company"
              icon={<BusinessCenterOutlinedIcon fontSize="small" />}
              color={C.primary}
              label="Adaugă companie"
              sublabel="Începe să recrutezi"
              warn
            />
          )}

          {/* ── Employer: my job listings ── */}
          {isAtLeastEmployer && hasCompanies && (
            <QuickAction
              href="/dashboard/jobs"
              icon={<WorkOutlineIcon fontSize="small" />}
              color={C.primary}
              label="Anunțurile mele"
              sublabel={`${publishedJobs} active${draftJobs > 0 ? `, ${draftJobs} ciorne` : ""}`}
            />
          )}

          {/* ── Employer: candidates overview ── */}
          {isAtLeastEmployer && hasCompanies && (
            <QuickAction
              href="/dashboard/candidates"
              icon={<GroupOutlinedIcon fontSize="small" />}
              color={C.secondary}
              label="Candidații mei"
              sublabel={`${applicationsReceived} ${applicationsReceived === 1 ? "aplicant" : "aplicanți"}`}
            />
          )}

          {/* ── Employer: forms ── */}
          {formsEnabled && isAtLeastEmployer && hasCompanies && (
            <QuickAction
              href="/dashboard/forms"
              icon={<ArticleOutlinedIcon fontSize="small" />}
              color={C.secondary}
              label="Formulare"
              sublabel={`${formsTotal} ${formsTotal === 1 ? "formular" : "formulare"}`}
            />
          )}

          {/* ── Admin: user management ── */}
          {isAdmin && (
            <QuickAction
              href="/dashboard/admin/users"
              icon={<ManageAccountsOutlinedIcon fontSize="small" />}
              color={C.danger}
              label="Utilizatori"
              sublabel="Gestionează roluri și conturi"
            />
          )}

          {/* ── Admin: skill approval ── */}
          {isAdmin && (
            <QuickAction
              href="/dashboard/admin/skills"
              icon={<PsychologyOutlinedIcon fontSize="small" />}
              color={C.secondary}
              label="Competențe"
              sublabel="Aprobă competențe noi"
            />
          )}
        </Box>
      </Box>
    </Stack>
  );
}
