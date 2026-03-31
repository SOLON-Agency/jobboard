import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type Skill = Tables<"skills">;

export type ProfileSkillWithName = {
  id: string;
  sort_order: number;
  skill: Skill;
};

/** Fetch all skills from the master catalogue (used for autocomplete). */
export const getAllSkills = async (
  supabase: SupabaseClient<Database>
): Promise<Skill[]> => {
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

/** Fetch a user's profile skills (joined with skill names), ordered by sort_order. */
export const getProfileSkills = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ProfileSkillWithName[]> => {
  const { data, error } = await supabase
    .from("profile_skills")
    .select("id, sort_order, skills!skill_id(id, name)")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    sort_order: row.sort_order,
    skill: row.skills as Skill,
  }));
};

/**
 * Find or create a skill by name, then add it to a user's profile.
 * Returns the new ProfileSkillWithName row.
 */
export const addProfileSkill = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  skillName: string,
  sortOrder: number
): Promise<ProfileSkillWithName> => {
  const trimmed = skillName.trim();

  // Find existing skill (case-insensitive) or create a new one
  let skill: Skill | null = null;

  const { data: existing } = await supabase
    .from("skills")
    .select("*")
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) {
    skill = existing;
  } else {
    const { data: created, error: createErr } = await supabase
      .from("skills")
      .insert({ name: trimmed })
      .select()
      .single();
    if (createErr) throw createErr;
    skill = created;
  }

  const { data: ps, error: psErr } = await supabase
    .from("profile_skills")
    .insert({ user_id: userId, skill_id: skill!.id, sort_order: sortOrder })
    .select()
    .single();

  if (psErr) throw psErr;

  return { id: ps.id, sort_order: ps.sort_order, skill: skill! };
};

/** Remove a profile skill row by its own id. */
export const removeProfileSkill = async (
  supabase: SupabaseClient<Database>,
  profileSkillId: string
): Promise<void> => {
  const { error } = await supabase
    .from("profile_skills")
    .delete()
    .eq("id", profileSkillId);

  if (error) throw error;
};

/** Bulk-update sort_order for a set of profile_skills rows. */
export const reorderProfileSkills = async (
  supabase: SupabaseClient<Database>,
  items: { id: string; sort_order: number }[]
): Promise<void> => {
  await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase.from("profile_skills").update({ sort_order }).eq("id", id)
    )
  );
};
