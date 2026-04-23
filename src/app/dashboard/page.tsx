import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import type { DashboardStats } from "@/components/dashboard/DashboardContent";
import appSettings from "@/config/app.settings.json";

// Groups an array of ISO date strings into monthly buckets for the last N months.
function groupByMonth(dates: (string | null)[], months = 6): { month: string; count: number }[] {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const label = d.toLocaleDateString("ro-RO", { month: "short" });
    const count = dates.filter((date) => {
      if (!date) return false;
      const dd = new Date(date);
      return dd.getFullYear() === d.getFullYear() && dd.getMonth() === d.getMonth();
    }).length;
    return { month: label, count };
  });
}

const APP_STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  reviewing: "În revizuire",
  interview: "Interviu",
  accepted: "Acceptat",
  rejected: "Respins",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Fetch user context ────────────────────────────────────────────────────
  const [{ data: profile }, { data: companyUsers }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("company_users").select("company_id").eq("user_id", user.id),
  ]);

  const companyIds = companyUsers?.map((c) => c.company_id) ?? [];

  // ── Parallel fetches ──────────────────────────────────────────────────────
  const [
    jobsRes,
    appsSentRes,
    savedCompaniesRes,
    formsRes,
    companiesRes,
    expCountRes,
    eduCountRes,
    skillsCountRes,
    alertsCountRes,
    archivedAppsRes,
  ] = await Promise.all([
    companyIds.length > 0
      ? supabase.from("job_listings").select("id, status, created_at").in("company_id", companyIds)
      : Promise.resolve({ data: [] as { id: string; status: string; created_at: string }[] }),

    supabase.from("applications").select("applied_at, status, is_archived").eq("user_id", user.id),

    supabase.from("company_favourites").select("company_id", { count: "exact", head: true }).eq("user_id", user.id),

    companyIds.length > 0
      ? supabase.from("forms").select("id, status").in("company_id", companyIds)
      : Promise.resolve({ data: [] as { id: string; status: string }[] }),

    companyIds.length > 0
      ? supabase.from("companies").select("visits, engages, is_archived").in("id", companyIds)
      : Promise.resolve({ data: [] as { visits: number; engages: number; is_archived: boolean }[] }),

    // Profile completeness: experience, education, skills
    supabase.from("profile_experience").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("profile_education").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("profile_skills").select("id", { count: "exact", head: true }).eq("user_id", user.id),

    // Alerts (only if feature enabled — falls back to zero count)
    appSettings.features.alerts
      ? supabase.from("alerts").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      : Promise.resolve({ count: 0 }),

    // Archived applications for the user
    supabase.from("applications").select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_archived", true),
  ]);

  const jobs = jobsRes.data ?? [];
  const jobIds = jobs.map((j) => j.id);
  const applicationsSent = appsSentRes.data ?? [];
  const forms = formsRes.data ?? [];
  const formIds = forms.map((f) => f.id);

  // Applications received and form responses require job/form IDs first
  const [appsReceivedRes, formResponsesRes] = await Promise.all([
    jobIds.length > 0
      ? supabase.from("applications").select("applied_at, status").in("job_id", jobIds)
      : Promise.resolve({ data: [] as { applied_at: string; status: string }[] }),

    formIds.length > 0
      ? supabase.from("form_responses").select("created_at").in("form_id", formIds)
      : Promise.resolve({ data: [] as { created_at: string }[] }),
  ]);

  const applicationsReceived = appsReceivedRes.data ?? [];
  const formResponses = formResponsesRes.data ?? [];

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const publishedJobs = jobs.filter((j) => j.status === "published").length;
  const draftJobs = jobs.filter((j) => j.status === "draft").length;
  const archivedJobs = jobs.filter((j) => j.status === "archived").length;

  // Profile completeness breakdown
  const profileHasAvatar = !!profile?.avatar_url;
  const profileHasBio = !!profile?.headline;
  const profileHasExperience = (expCountRes.count ?? 0) > 0;
  const profileHasEducation = (eduCountRes.count ?? 0) > 0;
  const profileHasSkills = (skillsCountRes.count ?? 0) > 0;

  // Milestone flags
  const hasAlerts = (alertsCountRes.count ?? 0) > 0;
  const hasRejectedCandidate = applicationsReceived.some((a) => a.status === "rejected");
  const hasShortlistedCandidate = applicationsReceived.some((a) => a.status === "shortlisted");

  const companyRows = (companiesRes.data ?? []) as { visits: number; engages: number; is_archived: boolean }[];
  const hasArchivedCompany = companyRows.some((c) => c.is_archived);
  const hasArchivedApplication = (archivedAppsRes.count ?? 0) > 0;
  const hasArchived = hasArchivedApplication || archivedJobs > 0 || hasArchivedCompany;

  const jobsByStatus = [
    { name: "Publicate", value: publishedJobs },
    { name: "Ciornă", value: draftJobs },
    { name: "Arhivate", value: archivedJobs },
  ].filter((s) => s.value > 0);

  const appStatusMap = applicationsSent.reduce<Record<string, number>>((acc, a) => {
    const key = a.status ?? "pending";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const applicationsByStatus = Object.entries(appStatusMap).map(([key, value]) => ({
    name: APP_STATUS_LABELS[key] ?? key,
    value,
  }));

  // Monthly groupings
  const sentMonths = groupByMonth(applicationsSent.map((a) => a.applied_at));
  const receivedMonths = groupByMonth(applicationsReceived.map((a) => a.applied_at));

  const activityByMonth = sentMonths.map((m, i) => ({
    month: m.month,
    sent: m.count,
    received: receivedMonths[i]?.count ?? 0,
  }));

  const formResponsesByMonth = groupByMonth(formResponses.map((r) => r.created_at)).map((m) => ({
    month: m.month,
    count: m.count,
  }));

  // Profile completeness: name + headline + avatar
  const profileComplete = !!(profile?.full_name && profile?.headline && profile?.avatar_url);

  // Sum visits and engages across all user companies
  const companyVisits = companyRows.reduce((sum, c) => sum + (c.visits ?? 0), 0);
  const companyEngages = companyRows.reduce((sum, c) => sum + (c.engages ?? 0), 0);

  const stats: DashboardStats = {
    profileName: profile?.full_name ?? null,
    profileComplete,
    profileHasAvatar,
    profileHasBio,
    profileHasExperience,
    profileHasEducation,
    profileHasSkills,
    publishedJobs,
    draftJobs,
    applicationsReceived: applicationsReceived.length,
    applicationsSent: applicationsSent.length,
    savedCompanies: savedCompaniesRes.count ?? 0,
    formsTotal: forms.length,
    formResponsesTotal: formResponses.length,
    hasCompanies: companyIds.length > 0,
    companyVisits: companyIds.length > 0 ? companyVisits : undefined,
    companyEngages: companyIds.length > 0 ? companyEngages : undefined,
    hasAlerts,
    hasRejectedCandidate,
    hasShortlistedCandidate,
    hasArchived,
    activityByMonth,
    jobsByStatus,
    applicationsByStatus,
    formResponsesByMonth,
  };

  return <DashboardContent {...stats} />;
}
