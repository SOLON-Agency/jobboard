"use client";

import { useState, useEffect, useCallback } from "react";

export interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Generic hook for async data fetching with loading and error state.
 * Replaces the repeated `useState(loading) + useCallback(load) + useEffect` pattern
 * found across dashboard pages.
 *
 * @pattern AsyncDataFetching
 * @usedBy dashboard/jobs, dashboard/company, dashboard/forms, dashboard/applications,
 *         dashboard/archive, dashboard/alerts, dashboard/profile, JobList
 * @example
 * ```tsx
 * const { data: jobs, loading, error, reload } = useAsyncData(
 *   () => getCompanyJobs(supabase, companyId),
 *   [companyId]
 * );
 * ```
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "A apărut o eroare.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  return { data, loading, error, reload };
}
