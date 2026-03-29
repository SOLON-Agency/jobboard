import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const getUserConversations = async (
  supabase: SupabaseClient<Database>,
  userId: string
) => {
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (!participations?.length) return [];

  const conversationIds = participations.map((p) => p.conversation_id);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .in("id", conversationIds)
    .order("created_at", { ascending: false });

  return conversations ?? [];
};

export const getOrCreateConversation = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  otherUserId: string
) => {
  const { data: myConversations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (myConversations?.length) {
    const myConvIds = myConversations.map((c) => c.conversation_id);
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myConvIds);

    if (shared?.length) {
      return shared[0].conversation_id;
    }
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({})
    .select()
    .single();

  if (error || !conversation) throw error ?? new Error("Failed to create conversation");

  await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: userId },
    { conversation_id: conversation.id, user_id: otherUserId },
  ]);

  return conversation.id;
};
