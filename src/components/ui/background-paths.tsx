"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function FloatingPaths({ position }: { position: number }) {
  const reduced = useReducedMotion();
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(15,23,42,${0.1 + i * 0.03})`,
    width: 0.5 + i * 0.03,
    duration: 20 + (i % 10),
  }));

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <svg
        className="h-full w-full text-slate-950 dark:text-white"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Fundal decorativ</title>
        {paths.map((path) =>
          reduced ? (
            <path
              key={path.id}
              d={path.d}
              stroke="currentColor"
              strokeWidth={path.width}
              strokeOpacity={0.08 + path.id * 0.02}
              pathLength={1}
              fill="none"
            />
          ) : (
            <motion.path
              key={path.id}
              d={path.d}
              stroke="currentColor"
              strokeWidth={path.width}
              strokeOpacity={0.1 + path.id * 0.03}
              initial={{ pathLength: 0.3, opacity: 0.6 }}
              animate={{
                pathLength: 1,
                opacity: [0.3, 0.6, 0.3],
                pathOffset: [0, 1, 0],
              }}
              transition={{
                duration: path.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          )
        )}
      </svg>
    </div>
  );
}

export type BackgroundPathsHighlight = {
  title: string;
  description: string;
};

export interface BackgroundPathsProps {
  title: string;
  description?: string;
  ctaLabel: string;
  ctaHref: string;
  /** When true, fits as a page section instead of full viewport height. */
  compact?: boolean;
  highlights?: readonly BackgroundPathsHighlight[];
  /** Use h2 on pages that already have an h1 (default for compact). */
  headingLevel?: "h1" | "h2";
  /** When set, applied to the title heading for landmark / aria-labelledby. */
  sectionHeadingId?: string;
  /** Optional line above the title (e.g. MUI overline). */
  overline?: ReactNode;
}

export const BackgroundPaths = ({
  title,
  description,
  ctaLabel,
  ctaHref,
  compact = false,
  highlights,
  headingLevel,
  sectionHeadingId,
  overline,
}: BackgroundPathsProps) => {
  const reduced = useReducedMotion();
  const words = title.split(" ").filter((w) => w.length > 0);
  const level = headingLevel ?? (compact ? "h2" : "h1");

  const titleEl = (
    <span className="block">
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="mr-4 inline-block last:mr-0">
          {word.split("").map((letter, letterIndex) => (
            <motion.span
              key={`${wordIndex}-${letterIndex}`}
              initial={reduced ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }
              }
              className="inline-block bg-gradient-to-r from-neutral-900 to-neutral-700/80 bg-clip-text text-transparent dark:from-white dark:to-white/80"
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden bg-white dark:bg-neutral-950",
        compact ? "min-h-[min(640px,85vh)] py-12 md:py-16" : "min-h-screen"
      )}
    >
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl px-4 text-center md:px-6">
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 2 }}
          className="mx-auto max-w-4xl"
        >
          {overline}
          {level === "h1" ? (
            <h1
              id={sectionHeadingId}
              className="m-0 mb-6 bg-transparent p-0 text-4xl font-bold tracking-tighter sm:text-7xl md:text-8xl"
            >
              {titleEl}
            </h1>
          ) : (
            <h2
              id={sectionHeadingId}
              className="m-0 mb-6 bg-transparent p-0 text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl"
            >
              {titleEl}
            </h2>
          )}

          {description ? (
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-neutral-300 md:text-lg">
              {description}
            </p>
          ) : null}

          <div className="group inline-block overflow-hidden rounded-2xl bg-gradient-to-b from-black/10 to-white/10 p-px shadow-lg backdrop-blur-lg transition-shadow duration-300 hover:shadow-xl dark:from-white/10 dark:to-black/10">
            <Button
              asChild
              variant="ghost"
              className="rounded-[1.15rem] border border-black/10 bg-white/95 px-8 py-6 text-lg font-semibold text-black backdrop-blur-md transition-all duration-300 hover:bg-white/100 hover:shadow-md dark:border-white/10 dark:bg-black/95 dark:text-white dark:hover:bg-black/100 dark:hover:shadow-neutral-800/50"
            >
              <Link
                href={ctaHref}
                className="inline-flex items-center no-underline [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-slate-400 [&:focus-visible]:ring-offset-2"
              >
                <span className="opacity-90 transition-opacity group-hover:opacity-100">
                  {ctaLabel}
                </span>
                <span
                  className="ml-3 opacity-70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            </Button>
          </div>

          {highlights && highlights.length > 0 ? (
            <ul className="mx-auto mt-12 grid max-w-4xl gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/50"
                >
                  <span className="mb-2 block text-base font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </span>
                  <span className="block text-sm leading-relaxed text-slate-600 dark:text-neutral-400">
                    {item.description}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
};
