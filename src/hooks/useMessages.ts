"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "./useSupabase";
import { useAuth } from "./useAuth";
import type { Tables } from "@/types/database";

export const useMessages = (conversationId: string | null) => {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Tables<"messages">[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Tables<"messages">;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !conversationId) return;
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
    },
    [supabase, user, conversationId]
  );

  return { messages, loading, sendMessage };
};
