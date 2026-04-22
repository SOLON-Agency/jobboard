"use client";

import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import createCache, { type EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { theme } from "./theme";

interface InsertedEntry {
  name: string;
  isGlobal: boolean;
}

interface EmotionRegistry {
  cache: EmotionCache;
  flush: () => InsertedEntry[];
}

const createEmotionRegistry = (): EmotionRegistry => {
  const cache = createCache({ key: "mui" });
  cache.compat = true;

  const prevInsert = cache.insert;
  let inserted: InsertedEntry[] = [];

  cache.insert = (...args) => {
    const [selector, serialized] = args;
    if (cache.inserted[serialized.name] === undefined) {
      inserted.push({ name: serialized.name, isGlobal: !selector });
    }
    return prevInsert(...args);
  };

  const flush = () => {
    const prev = inserted;
    inserted = [];
    return prev;
  };

  return { cache, flush };
};

export function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ cache, flush }] = React.useState(createEmotionRegistry);

  useServerInsertedHTML(() => {
    const entries = flush();
    if (entries.length === 0) return null;

    let styles = "";
    let dataAttr = cache.key;
    const globals: { name: string; style: string }[] = [];

    for (const { name, isGlobal } of entries) {
      const style = cache.inserted[name];
      if (typeof style === "string") {
        if (isGlobal) {
          globals.push({ name, style });
        } else {
          styles += style;
          dataAttr += ` ${name}`;
        }
      }
    }

    return (
      <>
        {globals.map(({ name, style }) => (
          <style
            key={name}
            data-emotion={`${cache.key}-global ${name}`}
            dangerouslySetInnerHTML={{ __html: style }}
          />
        ))}
        {styles && (
          <style
            data-emotion={dataAttr}
            dangerouslySetInnerHTML={{ __html: styles }}
          />
        )}
      </>
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};
