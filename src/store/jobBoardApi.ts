"use client";

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getEmployerJobsDashboard, type EmployerJobsDashboardData } from "@/services/jobs.service";

/** Passed via Redux thunk `extraArgument` — see `makeStore`. */
export type JobBoardThunkExtra = {
  getSupabase: () => SupabaseClient<Database>;
};

export const jobBoardApi = createApi({
  reducerPath: "jobBoardApi",
  baseQuery: fakeBaseQuery(),
  /**
   * Job-board defaults: keep dashboard payloads warm briefly; refresh when user returns to tab / reconnects.
   */
  keepUnusedDataFor: 300,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ["EmployerDashboard"],
  endpoints: (builder) => ({
    employerJobsDashboard: builder.query<EmployerJobsDashboardData, string>({
      queryFn: async (userId, api) => {
        const extra = api.extra as JobBoardThunkExtra | undefined;
        if (!extra?.getSupabase) {
          return {
            error: { message: "Redux store missing Supabase client." },
          };
        }
        try {
          const data = await getEmployerJobsDashboard(extra.getSupabase(), userId);
          return { data };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return { error: { message } };
        }
      },
      providesTags: (_result, _error, userId) => [
        { type: "EmployerDashboard", id: userId },
      ],
    }),
  }),
});

export const { useEmployerJobsDashboardQuery } = jobBoardApi;
