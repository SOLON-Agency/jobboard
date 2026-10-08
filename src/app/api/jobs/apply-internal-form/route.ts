import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api";
import {
  notifyJobApplication,
  submitInternalFormApplication,
} from "@/services/applications.service";

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

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user.email;

  const result = await submitInternalFormApplication(supabase, {
    jobId,
    userId: user.id,
    userEmail: user.email,
    userFullName: fullName,
    fieldValues,
  });

  if (!result.ok) {
    return apiError(result.message, result.status, result.code ? { code: result.code } : undefined);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  notifyJobApplication(supabase, result.jobId, session?.access_token);

  return apiSuccess({ ok: true as const });
}
