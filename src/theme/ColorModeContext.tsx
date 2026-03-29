"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ColorMode = "light" | "dark";

interface ColorModeContextValue {
  mode: ColorMode;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: "dark",
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

const STORAGE_KEY = "legaljobs-color-mode";

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<ColorMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorMode | null;
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setMode("light");
    }
    setMounted(true);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === "dark" ? "light" : "dark";
          localStorage.setItem(STORAGE_KEY, next);
          return next;
        });
      },
    }),
    [mode]
  );

  if (!mounted) {
    return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
  }

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  );
};
