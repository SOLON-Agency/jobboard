import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes (shadcn-style helper). */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  companies_slug_key: "O companie cu acest nume există deja. Te rugăm să alegi un alt nume.",
  companies_pkey: "Această companie există deja.",
  company_users_pkey: "Acest utilizator este deja membru al companiei.",
  job_listings_pkey: "Acest anunț de muncă există deja.",
};

const PG_CODE_MESSAGES: Record<string, string> = {
  "23505": "Un înregistrare cu aceste informații există deja.",
  "23503": "Această operațiune face referire la o înregistrare inexistentă.",
  "23502": "Un câmp obligatoriu lipsește.",
  "42501": "Nu ai permisiunea de a efectua această acțiune.",
};

export const parseSupabaseError = (err: unknown): string => {
  if (!err || typeof err !== "object") return "A apărut o eroare. Te rugăm să încerci din nou.";
  const { code, message } = err as SupabaseErrorLike;
  if (message) {
    for (const [constraint, friendly] of Object.entries(CONSTRAINT_MESSAGES)) {
      if (message.includes(constraint)) return friendly;
    }
  }
  if (code && code in PG_CODE_MESSAGES) return PG_CODE_MESSAGES[code];
  return "A apărut o eroare. Te rugăm să încerci din nou.";
};

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    // Romanian diacritics — both comma-below (ș ț) and cedilla (ş ţ) forms
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    // Generic accent removal (é → e, ö → o, etc.)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");

import appSettings from "@/config/app.settings.json";

export const formatSalary = (
  min: number | null,
  max: number | null,
  currency?: string | null
): string => {
  const code = currency ?? appSettings.config.currency;
  const locale = appSettings.config.locale;

  const fmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  });

  if (min && max) return `${fmt.format(min)} – ${fmt.format(max)}`;
  if (min) return `de la ${fmt.format(min)}`;
  // if (min) return `> ${fmt.format(min)}`;
  if (max) return `până la ${fmt.format(max)}`;
  // if (max) return `< ${fmt.format(max)}`;
  // return "Salariu nespecificat";
  return "";
};

export const formatDate = (date: string): string =>
  new Intl.DateTimeFormat("ro-RO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

export const timeAgo = (date: string): string => {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  const intervals = [
    { singular: "an", plural: "ani", seconds: 31536000 },
    { singular: "lună", plural: "luni", seconds: 2592000 },
    { singular: "săptămână", plural: "săptămâni", seconds: 604800 },
    { singular: "zi", plural: "zile", seconds: 86400 },
    { singular: "oră", plural: "ore", seconds: 3600 },
    { singular: "minut", plural: "minute", seconds: 60 },
  ] as const;

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `acum ${count} ${count === 1 ? interval.singular : interval.plural}`;
    }
  }
  return "Chiar acum";
};

export const jobTypeLabels: Record<string, string> = {
  "full-time": "Normă întreagă",
  "part-time": "Jumătate de normă",
  contract: "Colaborator",
  internship: "Practică",
  freelance: "Freelance",
};

/**
 * Consistent outlined-chip styling for each job type, derived from the brand
 * palette. Spread into the MUI Chip `sx` prop alongside any local overrides.
 *
 * Colors come from palette.ts:
 *   full-time  → success   #2d6a4f (forest green)
 *   part-time  → warning   #a0882a (amber)
 *   contract   → secondary #3E5C76 (steel blue)
 *   internship → secondary.light #748CAB (sky blue)
 *   freelance  → accentGold #c3ae61 (gold, text darkened for contrast)
 */
export const jobTypeChipSx: Record<string, Record<string, string>> = {
  "full-time": {
    color: "#2d6a4f",
    borderColor: "rgba(45,106,79,0.45)",
    bgcolor: "rgba(45,106,79,0.08)",
  },
  "part-time": {
    color: "#a0882a",
    borderColor: "rgba(160,136,42,0.45)",
    bgcolor: "rgba(160,136,42,0.08)",
  },
  contract: {
    color: "#3E5C76",
    borderColor: "rgba(62,92,118,0.45)",
    bgcolor: "rgba(62,92,118,0.08)",
  },
  internship: {
    color: "#5B7A94",
    borderColor: "rgba(116,140,171,0.5)",
    bgcolor: "rgba(116,140,171,0.1)",
  },
  freelance: {
    color: "#8a6e10",
    borderColor: "rgba(195,174,97,0.55)",
    bgcolor: "rgba(195,174,97,0.12)",
  },
};

export const truncate = (text: string, maxLength = 100): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;

export const experienceLevelLabels: Record<string, string> = {
  mid: "Student",
  entry: "Junior",
  senior: "Senior",
  lead: "Lider",
  executive: "Executiv",
};
