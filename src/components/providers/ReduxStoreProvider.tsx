"use client";

import { type ReactNode, useEffect, useMemo } from "react";
import { Provider } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
import { useSupabase } from "@/hooks/useSupabase";
import { makeStore } from "@/store/store";

export function ReduxStoreProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const store = useMemo(
    () =>
      makeStore({
        getSupabase: () => supabase,
      }),
    [supabase]
  );

  useEffect(() => {
    const unsubscribe = setupListeners(store.dispatch);
    return unsubscribe;
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
