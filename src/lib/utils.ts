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
  if (min) return `De la ${fmt.format(min)}`;
  if (max) return `Până la ${fmt.format(max)}`;
  return "Nespecificat";
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
  "full-time": "Fulltime",
  "part-time": "Parttime",
  contract: "Colaborator",
  internship: "Practică",
  freelance: "Freelance",
};

export const experienceLevelLabels: Record<string, string> = {
  entry: "Junior",
  mid: "Nivel mediu",
  senior: "Senior",
  lead: "Lider",
  executive: "Executiv",
};
