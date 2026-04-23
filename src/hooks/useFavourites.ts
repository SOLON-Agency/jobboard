"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useSupabase } from "./useSupabase";
import { useToast } from "@/contexts/ToastContext";
import {
  getUserJobFavourites,
  getUserCompanyFavourites,
  toggleJobFavourite,
  toggleCompanyFavourite,
} from "@/services/favourites.service";
import appSettings from "@/config/app.settings.json";

export interface UseFavouritesReturn {
  jobFavourites: Set<string>;
  companyFavourites: Set<string>;
  toggleJob: (jobId: string) => Promise<void>;
  toggleCompany: (companyId: string) => Promise<void>;
  isJobFavourite: (jobId: string) => boolean;
  isCompanyFavourite: (companyId: string) => boolean;
}

export function useFavourites(): UseFavouritesReturn {
  const { user } = useAuth();
  const supabase = useSupabase();
  const { showToast } = useToast();

  const [jobFavourites, setJobFavourites] = useState<Set<string>>(new Set());
  const [companyFavourites, setCompanyFavourites] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!user || !appSettings.features.favourites) return;
    void getUserJobFavourites(supabase, user.id)
      .then(setJobFavourites)
      .catch(() => {});
    void getUserCompanyFavourites(supabase, user.id)
      .then(setCompanyFavourites)
      .catch(() => {});
  }, [supabase, user]);

  const toggleJob = useCallback(
    async (jobId: string) => {
      if (!user) return;
      const isFav = await toggleJobFavourite(supabase, user.id, jobId);
      setJobFavourites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      showToast(isFav ? "Anunț salvat la favorite." : "Anunț eliminat din favorite.", "info", 2500);
    },
    [supabase, user, showToast]
  );

  const toggleCompany = useCallback(
    async (companyId: string) => {
      if (!user) return;
      const isFav = await toggleCompanyFavourite(supabase, user.id, companyId);
      setCompanyFavourites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(companyId);
        else next.delete(companyId);
        return next;
      });
      showToast(isFav ? "Companie salvată la favorite." : "Companie eliminată din favorite.", "info", 2500);
    },
    [supabase, user, showToast]
  );

  return {
    jobFavourites,
    companyFavourites,
    toggleJob,
    toggleCompany,
    isJobFavourite: (jobId: string) => jobFavourites.has(jobId),
    isCompanyFavourite: (companyId: string) =>
      companyFavourites.has(companyId),
  };
}
