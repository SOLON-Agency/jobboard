"use client";

import { configureStore } from "@reduxjs/toolkit";
import { jobBoardApi } from "@/store/jobBoardApi";
import type { JobBoardThunkExtra } from "@/store/jobBoardApi";

export function makeStore(extra: JobBoardThunkExtra) {
  return configureStore({
    reducer: {
      [jobBoardApi.reducerPath]: jobBoardApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: extra,
        },
      }).concat(jobBoardApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
