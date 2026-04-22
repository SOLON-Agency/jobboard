"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
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

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  href?: string;
}

function StatCard({ label, value, icon, accentColor, href }: StatCardProps) {
  return (
  <Paper
    component={href ? Link : "div"}
    href={href}
    sx={{
      p: 2.5,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      borderTop: `3px solid ${accentColor}`,
      textDecoration: "none",
      transition: "box-shadow 0.2s, border-color 0.2s",
      cursor: href ? "pointer" : "default",
      "&:hover": href ? { boxShadow: 3 } : {},
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="h3" fontWeight={800} sx={{ color: accentColor, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ color: accentColor, opacity: 0.7 }}>{icon}</Box>
    </Stack>
  </Paper>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  empty?: boolean;
  emptyLabel?: string;
}

function ChartCard({ title, subtitle, children, empty, emptyLabel }: ChartCardProps) {
  return (
  <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        {subtitle}
      </Typography>
    )}
    {!subtitle && <Box sx={{ mb: 2 }} />}
    {empty ? (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180 }}>
        <Typography variant="body2" color="text.disabled">
          {emptyLabel ?? "Nu existe date"}
        </Typography>
      </Box>
    ) : (
      children
    )}
  </Paper>
  );
}

const CHART_COLORS = {
  primary: "#03170C",
  secondary: "#3E5C76",
  secondaryLight: "#748CAB",
  gold: "#c3ae61",
  soft: "#F0EBD8",
  danger: "#c62828",
};

const PIE_COLORS_JOB = [CHART_COLORS.primary, CHART_COLORS.gold, CHART_COLORS.secondaryLight];
const PIE_COLORS_APP = [CHART_COLORS.secondaryLight, CHART_COLORS.secondary, CHART_COLORS.gold, CHART_COLORS.primary, CHART_COLORS.danger];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ px: 1.5, py: 1, border: "1px solid", borderColor: "divider", boxShadow: 2, minWidth: 120 }}>
      {label && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{label}</Typography>}
      {payload.map((p) => (
        <Stack key={p.name} direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color, flexShrink: 0 }} />
          <Typography variant="caption">{p.name}: <strong>{p.value}</strong></Typography>
        </Stack>
      ))}
    </Paper>
  );
};

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <Paper sx={{ px: 1.5, py: 1, border: "1px solid", borderColor: "divider", boxShadow: 2 }}>
      <Typography variant="caption">{p.name}: <strong>{p.value}</strong></Typography>
    </Paper>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

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
  useEffect(() => { setMounted(true); }, []);

  const formsEnabled = appSettings.features.forms;
  const favEnabled = appSettings.features.favouriteCompanies;

  const hasActivity = activityByMonth.some((m) => m.sent > 0 || m.received > 0);
  const hasJobStatus = jobsByStatus.some((s) => s.value > 0);
  const hasAppStatus = applicationsByStatus.some((s) => s.value > 0);
  const hasFormResponses = formResponsesByMonth.some((m) => m.count > 0);

  return (
    <Stack spacing={4}>
      {/* ── Welcome ──────────────────────────────────────────────────────── */}
      <Box>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
          Bine ai revenit{profileName ? `, ${profileName}` : ""}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Iată un rezumat al activității tale recente.
        </Typography>
      </Box>

      {/* ── Profile completion nudge ─────────────────────────────────────── */}
      {!profileComplete && (
        <Paper
          sx={{
            p: 2,
            border: "1px solid",
            borderColor: "warning.light",
            bgcolor: "warning.50",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <PersonOutlineIcon sx={{ color: "warning.dark" }} />
            <Box>
              <Typography variant="body2" fontWeight={600} color="warning.dark">
                Profilul tău este incomplet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Un profil complet crește șansele de a fi văzut de angajatori.
              </Typography>
            </Box>
          </Stack>
          <Button component={Link} href="/dashboard/profile" size="small" variant="outlined" color="warning">
            Completează profilul
          </Button>
        </Paper>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        {hasCompanies && (
          <StatCard
            label="Anunțuri publicate"
            value={publishedJobs}
            icon={<WorkOutlineIcon />}
            accentColor={CHART_COLORS.primary}
            href="/dashboard/jobs"
          />
        )}
        {hasCompanies && (
          <StatCard
            label="Ciornă"
            value={draftJobs}
            icon={<EditNoteIcon />}
            accentColor={CHART_COLORS.gold}
            href="/dashboard/jobs"
          />
        )}
        {hasCompanies && (
          <StatCard
            label="Aplicații primite"
            value={applicationsReceived}
            icon={<InboxOutlinedIcon />}
            accentColor={CHART_COLORS.secondary}
          />
        )}
        <StatCard
          label="Aplicații trimise"
          value={applicationsSent}
          icon={<SendIcon />}
          accentColor={CHART_COLORS.secondaryLight}
          href="/dashboard/applications"
        />
        {favEnabled && (
          <StatCard
            label="Companii salvate"
            value={savedCompanies}
            icon={<BookmarkOutlinedIcon />}
            accentColor={CHART_COLORS.gold}
          />
        )}
        {formsEnabled && hasCompanies && (
          <StatCard
            label="Formulare"
            value={formsTotal}
            icon={<ArticleOutlinedIcon />}
            accentColor={CHART_COLORS.secondary}
            href="/dashboard/forms"
          />
        )}
        {formsEnabled && hasCompanies && (
          <StatCard
            label="Răspunsuri formulare"
            value={formResponsesTotal}
            icon={<InboxOutlinedIcon />}
            accentColor={CHART_COLORS.primary}
            href="/dashboard/forms"
          />
        )}
        {hasCompanies && typeof companyVisits === "number" && (
          <StatCard
            label="Vizite companie"
            value={companyVisits}
            icon={<VisibilityOutlinedIcon />}
            accentColor={CHART_COLORS.primary}
          />
        )}
        {hasCompanies && typeof companyEngages === "number" && (
          <StatCard
            label="Interacțiuni companie"
            value={companyEngages}
            icon={<TouchAppOutlinedIcon />}
            accentColor={CHART_COLORS.secondary}
          />
        )}
      </Box>

      {/* ── Activity area chart ───────────────────────────────────────────── */}
      <ChartCard
        title="Activitate — ultimele 6 luni"
        subtitle="Aplicații trimise vs. primite pe lună"
        empty={!hasActivity}
        emptyLabel="Nicio activitate în ultimele 6 luni"
      >
        <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
          <Chip size="small" label="Trimise" sx={{ bgcolor: CHART_COLORS.gold, color: "#fff", fontWeight: 600 }} />
          {hasCompanies && <Chip size="small" label="Primite" sx={{ bgcolor: CHART_COLORS.primary, color: "#fff", fontWeight: 600 }} />}
        </Stack>
        {mounted ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activityByMonth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.gold} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CHART_COLORS.gold} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sent" name="Trimise" stroke={CHART_COLORS.gold} strokeWidth={2} fill="url(#gradSent)" dot={{ r: 3 }} />
              {hasCompanies && <Area type="monotone" dataKey="received" name="Primite" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#gradReceived)" dot={{ r: 3 }} />}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Skeleton variant="rounded" height={220} />
        )}
      </ChartCard>

      {/* ── Status charts ─────────────────────────────────────────────────── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        {hasCompanies && (
          <ChartCard
            title="Anunțuri după status"
            subtitle="Distribuția anunțurilor de muncă"
            empty={!hasJobStatus}
            emptyLabel="Niciun anunț creat"
          >
            {mounted ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <ResponsiveContainer width="60%" height={160}>
                  <PieChart>
                    <Pie data={jobsByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {jobsByStatus.map((entry, i) => (
                        <Cell key={entry.name} fill={PIE_COLORS_JOB[i % PIE_COLORS_JOB.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <Stack spacing={0.75} sx={{ flex: 1 }}>
                  {jobsByStatus.map((s, i) => (
                    <Stack key={s.name} direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: PIE_COLORS_JOB[i % PIE_COLORS_JOB.length], flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ flex: 1, textTransform: "capitalize" }}>{s.name}</Typography>
                      <Typography variant="caption" fontWeight={700}>{s.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ) : <Skeleton variant="rounded" height={160} />}
          </ChartCard>
        )}

        <ChartCard
          title="Aplicații trimise după status"
          subtitle="Statusul candidaturii tale"
          empty={!hasAppStatus}
          emptyLabel="Nicio aplicație trimisă"
        >
          {mounted ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <ResponsiveContainer width="60%" height={160}>
                <PieChart>
                  <Pie data={applicationsByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {applicationsByStatus.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS_APP[i % PIE_COLORS_APP.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <Stack spacing={0.75} sx={{ flex: 1 }}>
                {applicationsByStatus.map((s, i) => (
                  <Stack key={s.name} direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: PIE_COLORS_APP[i % PIE_COLORS_APP.length], flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ flex: 1, textTransform: "capitalize" }}>{s.name}</Typography>
                    <Typography variant="caption" fontWeight={700}>{s.value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ) : <Skeleton variant="rounded" height={160} />}
        </ChartCard>
      </Box>

      {/* ── Form responses chart ──────────────────────────────────────────── */}
      {formsEnabled && hasCompanies && (
        <ChartCard
          title="Răspunsuri formulare"
          subtitle="Numărul de răspunsuri primite lunar"
          empty={!hasFormResponses}
          emptyLabel="Niciun răspuns în ultimele 6 luni"
        >
          {mounted ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={formResponsesByMonth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Răspunsuri" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton variant="rounded" height={180} />
          )}
        </ChartCard>
      )}


      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          Acțiuni rapide
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {hasCompanies && (
            <Button component={Link} href="/dashboard/jobs" variant="contained" startIcon={<AddIcon />} size="small">
              Anunț nou
            </Button>
          )}
          {!hasCompanies && (
            <Button component={Link} href="/dashboard/company" variant="contained" startIcon={<AddIcon />} size="small">
              Adaugă companie
            </Button>
          )}
          <Button component={Link} href="/jobs" variant="outlined" startIcon={<SearchIcon />} size="small">
            Caută locuri de muncă
          </Button>
          {formsEnabled && hasCompanies && (
            <Button component={Link} href="/dashboard/forms" variant="outlined" startIcon={<ArticleOutlinedIcon />} size="small">
              Formulare
            </Button>
          )}
          {!profileComplete && (
            <Button component={Link} href="/dashboard/profile" variant="outlined" startIcon={<PersonOutlineIcon />} size="small">
              Completează profilul
            </Button>
          )}
        </Box>
      </Box>
    </Stack>
  );
};
