"use client";

import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { buildTheme } from "./theme";
import { ColorModeProvider, useColorMode } from "./ColorModeContext";

const createEmotionCache = () => createCache({ key: "mui" });

const ThemeRegistryInner: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cache] = React.useState(createEmotionCache);
  const { mode } = useColorMode();
  const theme = React.useMemo(() => buildTheme(mode), [mode]);

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted);
    if (names.length === 0) return null;

    let styles = "";
    for (const name of names) {
      const val = cache.inserted[name];
      if (typeof val === "string") {
        styles += val;
      }
    }

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};

export const ThemeRegistry: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ColorModeProvider>
    <ThemeRegistryInner>{children}</ThemeRegistryInner>
  </ColorModeProvider>
);
