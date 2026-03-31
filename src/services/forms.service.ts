import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type FormWithFields = Tables<"forms"> & { form_fields: Tables<"form_fields">[] };
export type FormResponseWithValues = Tables<"form_responses"> & {
  form_response_values: (Tables<"form_response_values"> & { form_fields: Tables<"form_fields"> | null })[];
};

// ─── Forms ────────────────────────────────────────────────────────────────────

export const getUserForms = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<(Tables<"forms"> & { response_count: number })[]> => {
  const { data: companies } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId);

  if (!companies?.length) return [];

  const companyIds = companies.map((c) => c.company_id);

  const { data } = await supabase
    .from("forms")
    .select("*, form_responses(count)")
    .in("company_id", companyIds)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (data ?? []).map((f) => ({
    ...f,
    response_count: (f.form_responses as unknown as { count: number }[])[0]?.count ?? 0,
  }));
};

export const getFormWithFields = async (
  supabase: SupabaseClient<Database>,
  formId: string
): Promise<FormWithFields> => {
  const { data, error } = await supabase
    .from("forms")
    .select("*, form_fields(*)")
    .eq("id", formId)
    .single();

  if (error) throw error;

  return {
    ...data,
    form_fields: [...(data.form_fields ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
};

export const createForm = async (
  supabase: SupabaseClient<Database>,
  form: Database["public"]["Tables"]["forms"]["Insert"],
  fields: Omit<Database["public"]["Tables"]["form_fields"]["Insert"], "form_id">[]
): Promise<Tables<"forms">> => {
  const { data: formData, error: formError } = await supabase
    .from("forms")
    .insert(form)
    .select()
    .single();

  if (formError) throw formError;

  if (fields.length > 0) {
    const { error: fieldsError } = await supabase
      .from("form_fields")
      .insert(fields.map((f) => ({ ...f, form_id: formData.id })));

    if (fieldsError) throw fieldsError;
  }

  return formData;
};

export const updateForm = async (
  supabase: SupabaseClient<Database>,
  formId: string,
  updates: Database["public"]["Tables"]["forms"]["Update"],
  fields: Omit<Database["public"]["Tables"]["form_fields"]["Insert"], "form_id">[]
): Promise<void> => {
  const { error } = await supabase.from("forms").update(updates).eq("id", formId);
  if (error) throw error;
  await updateFormFields(supabase, formId, fields);
};

export const updateFormFields = async (
  supabase: SupabaseClient<Database>,
  formId: string,
  fields: Omit<Database["public"]["Tables"]["form_fields"]["Insert"], "form_id">[]
): Promise<void> => {
  await supabase.from("form_fields").delete().eq("form_id", formId);

  if (fields.length > 0) {
    const { error } = await supabase
      .from("form_fields")
      .insert(fields.map((f) => ({ ...f, form_id: formId })));

    if (error) throw error;
  }
};

export const deleteForm = async (
  supabase: SupabaseClient<Database>,
  formId: string
): Promise<void> => {
  const { error } = await supabase.from("forms").delete().eq("id", formId);
  if (error) throw error;
};

export const publishForm = async (
  supabase: SupabaseClient<Database>,
  formId: string
): Promise<void> => {
  const { error } = await supabase
    .from("forms")
    .update({ status: "published" })
    .eq("id", formId);
  if (error) throw error;
};

// ─── Responses ────────────────────────────────────────────────────────────────

export type ResponseFilters = {
  q?: string;
  dateFrom?: string;
  dateTo?: string;
};

export const getFormResponses = async (
  supabase: SupabaseClient<Database>,
  formId: string,
  filters: ResponseFilters = {}
): Promise<FormResponseWithValues[]> => {
  let query = supabase
    .from("form_responses")
    .select("*, form_response_values(*, form_fields(*))")
    .eq("form_id", formId)
    .order("created_at", { ascending: false });

  if (filters.q) {
    query = query.or(
      `respondent_name.ilike.%${filters.q}%,respondent_email.ilike.%${filters.q}%`
    );
  }
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as FormResponseWithValues[];
};

export const archiveForm = async (
  supabase: SupabaseClient<Database>,
  id: string,
  archived: boolean
): Promise<void> => {
  const { error } = await supabase
    .from("forms")
    .update({
      is_archived: archived,
      archived_at: archived ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
};

export const getArchivedForms = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Tables<"forms">[]> => {
  const { data: companies } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId)
    .not("accepted_at", "is", null);

  if (!companies?.length) return [];

  const companyIds = companies.map((c) => c.company_id);

  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .in("company_id", companyIds)
    .eq("is_archived", true)
    .order("archived_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const deleteFormResponse = async (
  supabase: SupabaseClient<Database>,
  responseId: string
): Promise<void> => {
  const { error } = await supabase.from("form_responses").delete().eq("id", responseId);
  if (error) throw error;
};
