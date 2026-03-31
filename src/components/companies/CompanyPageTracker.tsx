"use client";

import { useEffect, useRef } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { trackCompanyVisit } from "@/services/companies.service";

interface CompanyPageTrackerProps {
  companyId: string;
}

export const CompanyPageTracker: React.FC<CompanyPageTrackerProps> = ({ companyId }) => {
  const supabase = useSupabase();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackCompanyVisit(supabase, companyId).catch(() => {});
  }, [supabase, companyId]);

  return null;
};
