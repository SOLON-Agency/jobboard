"use client";

import React, { createContext, useContext } from "react";

const FavouritesFeatureContext = createContext<boolean>(false);

export function FavouritesFeatureProvider({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) {
  return (
    <FavouritesFeatureContext.Provider value={value}>
      {children}
    </FavouritesFeatureContext.Provider>
  );
}

/** Whether job/company favourites UI and APIs should be active (from Vercel Flag, evaluated in root layout). */
export function useFavouritesFeature(): boolean {
  return useContext(FavouritesFeatureContext);
}
