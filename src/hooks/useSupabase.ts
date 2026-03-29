"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export const useSupabase = () => {
  const client = useMemo(() => createClient(), []);
  return client;
};
