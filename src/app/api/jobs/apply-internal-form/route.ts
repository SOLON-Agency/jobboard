import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api";

interface ApplyBody {
  job_id?: string;
  field_values?: Record<string, string>;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user?.id) {
    return apiError("Trebuie să fii autentificat.", 401);
  }

  if (!user.email?.trim()) {
    return apiError("Contul tău nu are adresă de email. Adaugă un email pentru a aplica.", 400);
  }

  let body: ApplyBody;
  try {
    body = (await request.json()) as ApplyBody;
  } catch {
    return apiError("Cerere invalidă.", 400);
  }

  const jobId = body.job_id;
  const fieldValues = body.field_values;

  if (!jobId || typeof fieldValues !== "object" || fieldValues === null) {
    return apiError("Date lipsă sau invalide.", 400);
  }

  const { data: job, error: jobErr } = await supabase
    .from("job_listings")
    .select("id, title, company_id, application_form_id, status, is_archived")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    return apiError("Anunț inexistent.", 404);
  }

  if (!job.application_form_id) {
    return apiError("Acest anunț nu folosește un formular intern.", 400);
  }

  if (job.status !== "published" || job.is_archived) {
    return apiError("Nu poți aplica la acest anunț.", 403);
  }

  const { data: formRow, error: formErr } = await supabase
    .from("forms")
    .select("id, status, is_archived")
    .eq("id", job.application_form_id)
    .single();

  if (formErr || !formRow || formRow.is_archived || formRow.status !== "published") {
    return apiError("Formularul de aplicare nu este disponibil.", 403);
  }

  const { data: fields, error: fieldsErr } = await supabase
    .from("form_fields")
    .select("id, label, is_required")
    .eq("form_id", job.application_form_id)
    .order("sort_order", { ascending: true });

  if (fieldsErr) {
    console.error("apply-internal-form form_fields:", fieldsErr);
    return apiError("Nu s-au putut încărca câmpurile formularului.", 500);
  }

  const fieldList = fields ?? [];

  for (const f of fieldList) {
    if (f.is_required) {
      const v = fieldValues[f.id]?.trim();
      if (!v) {
        return apiError(`Câmp obligatoriu: ${f.label}`, 400);
      }
    }
  }

  const { data: existingApp } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", job.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingApp) {
    return apiError("Ai aplicat deja la acest anunț.", 409, { code: "23505" });
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user.email;

  const { data: responseRow, error: respErr } = await supabase
    .from("form_responses")
    .insert({
      form_id: job.application_form_id,
      job_listing_id: job.id,
      respondent_email: user.email,
      respondent_name: fullName,
    })
    .select("id")
    .single();

  if (respErr) {
    console.error("apply-internal-form form_responses:", respErr);
    if (respErr.code === "23505") {
      return apiError("Ai aplicat deja la acest anunț.", 409, { code: "23505" });
    }
    return apiError(respErr.message ?? "Nu s-a putut înregistra răspunsul.", 400);
  }

  if (fieldList.length > 0) {
    const valueRows = fieldList.map((f) => ({
      response_id: responseRow.id,
      field_id: f.id,
      value: fieldValues[f.id] ?? null,
    }));

    const { error: valErr } = await supabase.from("form_response_values").insert(valueRows);
    if (valErr) {
      console.error("apply-internal-form form_response_values:", valErr);
      return apiError(valErr.message ?? "Nu s-au putut salva răspunsurile.", 500);
    }
  }

  const formDataJson = Object.fromEntries(fieldList.map((f) => [f.label, fieldValues[f.id] ?? ""]));

  const { error: appErr } = await supabase.from("applications").insert({
    job_id: job.id,
    user_id: user.id,
    form_data: formDataJson,
    status: "pending",
  });

  if (appErr) {
    console.error("apply-internal-form applications:", appErr);
    if (appErr.code === "23505") {
      return apiError("Ai aplicat deja la acest anunț.", 409, { code: "23505" });
    }
    return apiError(appErr.message ?? "Nu s-a putut înregistra candidatura.", 500);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const invokeOpts =
    session?.access_token != null
      ? {
          body: { job_id: job.id },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      : { body: { job_id: job.id } };

  // TODO: The "job-application" Edge Function folder is missing from supabase/functions/
  // — ensure it is deployed separately before this invocation can succeed.
  void supabase.functions.invoke("job-application", invokeOpts).catch((err: unknown) =>
    console.warn("apply-internal-form: job-application:", err),
  );

  return apiSuccess({ ok: true as const });
}
