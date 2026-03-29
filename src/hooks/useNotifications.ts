"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "./useSupabase";
import { useAuth } from "./useAuth";
import type { Tables } from "@/types/database";

export const useNotifications = () => {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Tables<"notifications">[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read_at).length);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Tables<"notifications">;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  const markAsRead = useCallback(
    async (id: string) => {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [supabase]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, [supabase, user]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
};
