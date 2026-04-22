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
    <Paper sx={{ px: 1.5, py: 1, border: "1px solid", borderColor: "divider", boxShadow: 3, minWidth: 120 }}>
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
    <Paper sx={{ px: 1.5, py: 1, border: "1px solid", borderColor: "divider", boxShadow: 3 }}>
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
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        borderLeft: `4px solid ${accentColor}`,
        textDecoration: "none",
        transition: "box-shadow 0.2s, transform 0.15s",
        cursor: href ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 2,
        "&:hover": href ? { boxShadow: 4, transform: "translateY(-1px)" } : {},
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
    <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
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

// ProfileProgress is always rendered inside the dark hero banner.
// All colors here are explicitly chosen for contrast on dark (#03170C→#3E5C76).
function ProfileProgress({ complete }: { complete: boolean }) {
  const steps = [
    { label: "Cont creat", done: true },
    { label: "Profil completat", done: complete },
  ];
  const pct = steps.filter((s) => s.done).length / steps.length;

  // On dark background: use light-on-dark tokens that pass WCAG AA
  // complete → bright green (#6fcf97 on dark ≈ 6.5:1), incomplete → gold tint
  const pctColor = complete ? "#6fcf97" : C.goldOnDark;
  const barColor = complete ? "#6fcf97" : C.goldOnDark;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Typography variant="caption" sx={{ color: `${C.soft}aa` }}>
          Progres cont
        </Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color: pctColor }}>
          {Math.round(pct * 100)}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct * 100}
        sx={{
          height: 6,
          borderRadius: 4,
          bgcolor: `${C.soft}22`,
          "& .MuiLinearProgress-bar": {
            bgcolor: barColor,
            borderRadius: 4,
          },
        }}
      />
      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        {steps.map((s) => (
          <Stack key={s.label} direction="row" alignItems="center" spacing={0.5}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: s.done ? barColor : `${C.soft}33`,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" sx={{ color: s.done ? C.soft : `${C.soft}66` }}>
              {s.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DashboardContent({
  profileName,
  profileComplete,
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
  activityByMonth,
  jobsByStatus,
  applicationsByStatus,
  formResponsesByMonth,
}: DashboardStats) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const formsEnabled = appSettings.features.forms;
  const favEnabled = appSettings.features.favouriteCompanies;

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
          border: "1px solid",
          borderColor: "divider",
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
                sx={{ bgcolor: C.goldOnDark, color: C.primary, fontWeight: 700, "&:hover": { bgcolor: "#c9b24e" } }}
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
          <ProfileProgress complete={profileComplete} />
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

      {/* ── Job-seeker stats ──────────────────────────────────────────────── */}
      <Box>
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
          {favEnabled && (
            <StatCard
              label="Companii salvate"
              value={savedCompanies}
              icon={<BookmarkOutlinedIcon fontSize="small" />}
              accentColor={C.gold}
              sublabel="În lista ta de urmărire"
            />
          )}
          <StatCard
            label="Statut aplicații"
            value={applicationsByStatus.find((s) => s.name === "În așteptare")?.value ?? applicationsSent}
            icon={<TrendingUpIcon fontSize="small" />}
            accentColor={C.secondary}
            href="/dashboard/applications"
            sublabel="Urmărește progresul"
          />
        </Box>
      </Box>

      {/* ── Employer stats (only if user has companies) ───────────────────── */}
      {hasCompanies && (
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
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            <StatCard
              label="Anunțuri active"
              value={publishedJobs}
              icon={<WorkOutlineIcon fontSize="small" />}
              accentColor={C.primary}
              href="/dashboard/jobs"
              sublabel="Vizibile candidaților"
            />
            <StatCard
              label="Ciornă"
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
              sublabel="De la candidați"
            />
            {typeof companyVisits === "number" && (
              <StatCard
                label="Vizite companie"
                value={companyVisits}
                icon={<VisibilityOutlinedIcon fontSize="small" />}
                accentColor={C.secondary}
                sublabel="Profilul tău vizitat"
              />
            )}
          </Box>

          {/* Company engagement secondary row */}
          {(typeof companyEngages === "number" || (formsEnabled && formsTotal > 0)) && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: 2,
                mt: 2,
              }}
            >
              {typeof companyEngages === "number" && (
                <StatCard
                  label="Interacțiuni"
                  value={companyEngages}
                  icon={<TouchAppOutlinedIcon fontSize="small" />}
                  accentColor={C.gold}
                  sublabel="Click-uri pe profilul companiei"
                />
              )}
              {formsEnabled && (
                <StatCard
                  label="Formulare"
                  value={formsTotal}
                  icon={<ArticleOutlinedIcon fontSize="small" />}
                  accentColor={C.secondary}
                  href="/dashboard/forms"
                  sublabel="Formulare create"
                />
              )}
              {formsEnabled && (
                <StatCard
                  label="Răspunsuri primite"
                  value={formResponsesTotal}
                  icon={<InboxOutlinedIcon fontSize="small" />}
                  accentColor={C.primary}
                  href="/dashboard/forms"
                  sublabel="La formularele tale"
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
              <Chip
                size="small"
                label="Trimise"
                sx={{ bgcolor: C.gold, color: "#ffffff", fontWeight: 600 }}
              />
              {hasCompanies && (
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
                  <Area
                    type="monotone"
                    dataKey="sent"
                    name="Trimise"
                    stroke={C.gold}
                    strokeWidth={2}
                    fill="url(#gradSent)"
                    dot={{ r: 3 }}
                  />
                  {hasCompanies && (
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
              gridTemplateColumns: { xs: "1fr", sm: hasCompanies ? "1fr 1fr" : "1fr" },
              gap: 2,
            }}
          >
            {hasCompanies && (
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

            <ChartCard
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
            </ChartCard>
          </Box>

          {/* Form responses bar chart */}
          {formsEnabled && hasCompanies && (
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
          <Paper
            component={Link}
            href="/jobs"
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              transition: "box-shadow 0.2s",
              "&:hover": { boxShadow: 3 },
            }}
          >
            <Avatar sx={{ bgcolor: `${C.secondary}18`, color: C.secondary, width: 36, height: 36 }}>
              <SearchIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Caută joburi
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Explorează ofertele disponibile
              </Typography>
            </Box>
          </Paper>

          <Paper
            component={Link}
            href="/dashboard/applications"
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              transition: "box-shadow 0.2s",
              "&:hover": { boxShadow: 3 },
            }}
          >
            <Avatar sx={{ bgcolor: `${C.gold}20`, color: C.gold, width: 36, height: 36 }}>
              <SendIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Aplicațiile mele
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {applicationsSent} {applicationsSent === 1 ? "candidatură" : "candidaturi"} trimise
              </Typography>
            </Box>
          </Paper>

          {!profileComplete && (
            <Paper
              component={Link}
              href="/dashboard/profile"
              sx={{
                p: 2,
                border: "1px dashed",
                // warning.main = #a0882a — use a slightly warmer tint for the bg
                borderColor: "#a0882a",
                borderRadius: 2,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                // very light amber tint — explicitly defined so MUI token fallback can't break it
                bgcolor: "#fdf6e3",
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 3 },
              }}
            >
              <Avatar sx={{ bgcolor: "#f5e6a3", color: "#6b560a", width: 36, height: 36 }}>
                <PersonOutlineIcon fontSize="small" />
              </Avatar>
              <Box>
                {/* #6b560a on #fdf6e3 ≈ 7.5:1 — passes WCAG AA & AAA */}
                <Typography variant="body2" fontWeight={600} sx={{ color: "#6b560a" }}>
                  Completează profilul
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Crește vizibilitatea ta
                </Typography>
              </Box>
            </Paper>
          )}

          {hasCompanies && (
            <Paper
              component={Link}
              href="/dashboard/jobs/new"
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 3 },
              }}
            >
              <Avatar sx={{ bgcolor: `${C.primary}18`, color: C.primary, width: 36, height: 36 }}>
                <AddIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Adaugă anunț
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Publică un loc de muncă nou
                </Typography>
              </Box>
            </Paper>
          )}

          {!hasCompanies && (
            <Paper
              component={Link}
              href="/dashboard/company"
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 3 },
              }}
            >
              <Avatar sx={{ bgcolor: `${C.primary}18`, color: C.primary, width: 36, height: 36 }}>
                <BusinessCenterOutlinedIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Adaugă companie
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Începe să recrutezi
                </Typography>
              </Box>
            </Paper>
          )}

          {formsEnabled && hasCompanies && (
            <Paper
              component={Link}
              href="/dashboard/forms"
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 3 },
              }}
            >
              <Avatar sx={{ bgcolor: `${C.secondary}18`, color: C.secondary, width: 36, height: 36 }}>
                <ArticleOutlinedIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Formulare
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gestionează formularele tale
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Stack>
  );
}
