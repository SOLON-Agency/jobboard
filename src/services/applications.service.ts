import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type UserApplication = Tables<"applications"> & {
  job_listings:
    | (Tables<"job_listings"> & { companies: Tables<"companies"> | null })
    | null;
};

export const getUserApplications = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserApplication[]> => {
  const { data, error } = await supabase
    .from("applications")
    .select("*, job_listings(*, companies(*))")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserApplication[];
};

export const withdrawApplication = async (
  supabase: SupabaseClient<Database>,
  id: string,
  reason: string
): Promise<Tables<"applications">> => {
  const { data, error } = await supabase
    .from("applications")
    .update({
      status: "withdrawn",
      withdraw_reason: reason,
      withdrawn_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const archiveApplication = async (
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Tables<"applications">> => {
  const { data, error } = await supabase
    .from("applications")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const restoreApplication = async (
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Tables<"applications">> => {
  const { data, error } = await supabase
    .from("applications")
    .update({
      is_archived: false,
      archived_at: null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getArchivedApplications = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserApplication[]> => {
  const { data, error } = await supabase
    .from("applications")
    .select("*, job_listings(*, companies(*))")
    .eq("user_id", userId)
    .eq("is_archived", true)
    .order("archived_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserApplication[];
};

type JobApplicationCandidateProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "avatar_url" | "headline"
>;

export type JobApplicationWithProfile = Tables<"applications"> & {
  profiles: JobApplicationCandidateProfile | null;
};

export const getJobApplications = async (
  supabase: SupabaseClient<Database>,
  jobId: string
): Promise<JobApplicationWithProfile[]> => {
  const { data: applications, error } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", jobId)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  if (!applications || applications.length === 0) return [];

  const userIds = Array.from(new Set(applications.map((a) => a.user_id)));

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, headline")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  const profileById = new Map<string, JobApplicationCandidateProfile>(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return applications.map((a) => ({
    ...a,
    profiles: profileById.get(a.user_id) ?? null,
  }));
};

export const updateApplicationStatus = async (
  supabase: SupabaseClient<Database>,
  id: string,
  status: Database["public"]["Tables"]["applications"]["Update"]["status"]
) => {
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Check whether a user has already applied to a specific job.
 * Returns `true` if an application row exists, `false` otherwise.
 *
 * @pattern ServiceQuery
 * @usedBy src/components/jobs/ApplyButton.tsx, src/app/api/jobs/apply-internal-form/route.ts
 * @example
 * ```ts
 * const applied = await hasApplied(supabase, jobId, user.id);
 * ```
 *
 * RLS: authenticated users can select their own applications (user_id = auth.uid()).
 */
export const hasApplied = async (
  supabase: SupabaseClient<Database>,
  jobId: string,
  userId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  return data !== null;
};

// ── Employer-wide candidates ───────────────────────────────────────────────────

export type EmployerCandidate = Tables<"applications"> & {
  profiles: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url" | "headline"> | null;
  job_listings: (Pick<Tables<"job_listings">, "id" | "title" | "slug"> & {
    companies: Pick<Tables<"companies">, "id" | "name" | "slug"> | null;
  }) | null;
};

/**
 * Fetch all applications across every job listing owned by this employer.
 * Returns an empty array if the employer has no companies or no job listings.
 */
export const getEmployerCandidates = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<EmployerCandidate[]> => {
  // 1. Resolve company IDs the user is a member of
  const { data: companyUsers, error: cuErr } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId)
    .not("accepted_at", "is", null);

  if (cuErr) throw cuErr;
  const companyIds = (companyUsers ?? []).map((cu) => cu.company_id);
  if (!companyIds.length) return [];

  // 2. Resolve job IDs for those companies
  const { data: jobRows, error: jErr } = await supabase
    .from("job_listings")
    .select("id")
    .in("company_id", companyIds);

  if (jErr) throw jErr;
  const jobIds = (jobRows ?? []).map((j) => j.id);
  if (!jobIds.length) return [];

  // 3. Fetch applications with joined job + company data
  //    (profiles cannot be joined via PostgREST because applications.user_id
  //    is a FK to auth.users, not public.profiles — fetch separately)
  const { data: apps, error } = await supabase
    .from("applications")
    .select(`
      *,
      job_listings!job_id(id, title, slug, companies!company_id(id, name, slug))
    `)
    .in("job_id", jobIds)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  if (!apps || apps.length === 0) return [];

  // 4. Fetch profiles for the unique applicant user IDs
  const userIds = Array.from(new Set(apps.map((a) => a.user_id)));
  const { data: profileRows, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, headline")
    .in("id", userIds);

  if (pErr) throw pErr;

  type ProfileRow = Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url" | "headline">;
  const profileById = new Map<string, ProfileRow>(
    (profileRows ?? []).map((p) => [p.id, p as ProfileRow])
  );

  // 5. Merge profiles into applications in JS
  return apps.map((a) => ({
    ...a,
    profiles: profileById.get(a.user_id) ?? null,
  })) as unknown as EmployerCandidate[];
};

// ── Apply flow ─────────────────────────────────────────────────────────────────

/** Unique violation on `applications` (not form_responses). */
export const isApplicationsDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const { code, message = "" } = err as { code?: string; message?: string };
  if (code !== "23505") return false;
  const m = message.toLowerCase();
  if (m.includes("form_response")) return false;
  return m.includes("application") || /job_id|user_id/.test(m);
};

/**
 * Record an external-URL or email application (no internal form).
 *
 * RLS: authenticated users can insert their own application rows.
 */
export const createExternalApplication = async (
  supabase: SupabaseClient<Database>,
  jobId: string,
  userId: string
): Promise<Tables<"applications">> => {
  const { data, error } = await supabase
    .from("applications")
    .insert({
      job_id: jobId,
      user_id: userId,
      form_data: null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Upload an application form attachment and return its public URL.
 *
 * RLS: authenticated users can upload to the attachments bucket.
 */
export const uploadApplicationAttachment = async (
  supabase: SupabaseClient<Database>,
  jobId: string,
  fieldId: string,
  file: File
): Promise<string> => {
  const path = `${jobId}/${fieldId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("attachments").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("attachments").getPublicUrl(path);
  return data.publicUrl;
};

/** Fire-and-forget job-application Edge Function invoke. */
export const notifyJobApplication = (
  supabase: SupabaseClient<Database>,
  jobId: string,
  accessToken?: string | null
): void => {
  const invokeOpts =
    accessToken != null
      ? {
          body: { job_id: jobId },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      : { body: { job_id: jobId } };

  void supabase.functions
    .invoke("job-application", invokeOpts)
    .catch((err: unknown) => console.warn("job-application:", err));
};

export type SubmitInternalFormInput = {
  jobId: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  fieldValues: Record<string, string>;
};

export type SubmitInternalFormResult =
  | { ok: true; jobId: string }
  | { ok: false; status: number; message: string; code?: string };

/**
 * Submit an internal-form job application: validates job/form, writes responses, inserts application.
 *
 * RLS: authenticated applicant can insert form_responses, form_response_values, and applications.
 */
export const submitInternalFormApplication = async (
  supabase: SupabaseClient<Database>,
  input: SubmitInternalFormInput
): Promise<SubmitInternalFormResult> => {
  const { jobId, userId, userEmail, userFullName, fieldValues } = input;

  const { data: job, error: jobErr } = await supabase
    .from("job_listings")
    .select("id, title, company_id, application_form_id, status, is_archived")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    return { ok: false, status: 404, message: "Anunț inexistent." };
  }

  if (!job.application_form_id) {
    return { ok: false, status: 400, message: "Acest anunț nu folosește un formular intern." };
  }

  if (job.status !== "published" || job.is_archived) {
    return { ok: false, status: 403, message: "Nu poți aplica la acest anunț." };
  }

  const { data: formRow, error: formErr } = await supabase
    .from("forms")
    .select("id, status, is_archived")
    .eq("id", job.application_form_id)
    .single();

  if (formErr || !formRow || formRow.is_archived || formRow.status !== "published") {
    return { ok: false, status: 403, message: "Formularul de aplicare nu este disponibil." };
  }

  const { data: fields, error: fieldsErr } = await supabase
    .from("form_fields")
    .select("id, label, is_required, field_type")
    .eq("form_id", job.application_form_id)
    .order("sort_order", { ascending: true });

  if (fieldsErr) {
    console.error("submitInternalFormApplication form_fields:", fieldsErr);
    return { ok: false, status: 500, message: "Nu s-au putut încărca câmpurile formularului." };
  }

  const fieldList = fields ?? [];

  for (const f of fieldList) {
    if (f.is_required) {
      const v = fieldValues[f.id]?.trim();
      if (!v) {
        return { ok: false, status: 400, message: `Câmp obligatoriu: ${f.label}` };
      }
    }
  }

  if (await hasApplied(supabase, job.id, userId)) {
    return {
      ok: false,
      status: 409,
      message: "Ai aplicat deja la acest anunț.",
      code: "23505",
    };
  }

  const { data: responseRow, error: respErr } = await supabase
    .from("form_responses")
    .insert({
      form_id: job.application_form_id,
      job_listing_id: job.id,
      respondent_email: userEmail,
      respondent_name: userFullName,
    })
    .select("id")
    .single();

  if (respErr) {
    console.error("submitInternalFormApplication form_responses:", respErr);
    if (respErr.code === "23505") {
      return {
        ok: false,
        status: 409,
        message: "Ai aplicat deja la acest anunț.",
        code: "23505",
      };
    }
    return {
      ok: false,
      status: 400,
      message: respErr.message ?? "Nu s-a putut înregistra răspunsul.",
    };
  }

  if (fieldList.length > 0) {
    const valueRows = fieldList.map((f) => ({
      response_id: responseRow.id,
      field_id: f.id,
      value: fieldValues[f.id] ?? null,
    }));

    const { error: valErr } = await supabase.from("form_response_values").insert(valueRows);
    if (valErr) {
      console.error("submitInternalFormApplication form_response_values:", valErr);
      return {
        ok: false,
        status: 500,
        message: valErr.message ?? "Nu s-au putut salva răspunsurile.",
      };
    }
  }

  const formDataJson = Object.fromEntries(
    fieldList.map((f) => [f.label, fieldValues[f.id] ?? ""])
  );

  const { error: appErr } = await supabase.from("applications").insert({
    job_id: job.id,
    user_id: userId,
    form_data: formDataJson,
    status: "pending",
  });

  if (appErr) {
    console.error("submitInternalFormApplication applications:", appErr);
    if (appErr.code === "23505") {
      return {
        ok: false,
        status: 409,
        message: "Ai aplicat deja la acest anunț.",
        code: "23505",
      };
    }
    return {
      ok: false,
      status: 500,
      message: appErr.message ?? "Nu s-a putut înregistra candidatura.",
    };
  }

  return { ok: true, jobId: job.id };
};
