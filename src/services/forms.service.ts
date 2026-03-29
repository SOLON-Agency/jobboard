import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export const getFormWithFields = async (
  supabase: SupabaseClient<Database>,
  formId: string
): Promise<Tables<"forms"> & { form_fields: Tables<"form_fields">[] }> => {
  const { data, error } = await supabase
    .from("forms")
    .select("*, form_fields(*)")
    .eq("id", formId)
    .single();

  if (error) throw error;

  return {
    ...data,
    form_fields: [...(data.form_fields ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  };
};

export const createForm = async (
  supabase: SupabaseClient<Database>,
  form: Database["public"]["Tables"]["forms"]["Insert"],
  fields: Omit<Database["public"]["Tables"]["form_fields"]["Insert"], "form_id">[]
) => {
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

export const updateFormFields = async (
  supabase: SupabaseClient<Database>,
  formId: string,
  fields: Omit<Database["public"]["Tables"]["form_fields"]["Insert"], "form_id">[]
) => {
  await supabase.from("form_fields").delete().eq("form_id", formId);

  if (fields.length > 0) {
    const { error } = await supabase
      .from("form_fields")
      .insert(fields.map((f) => ({ ...f, form_id: formId })));

    if (error) throw error;
  }
};
