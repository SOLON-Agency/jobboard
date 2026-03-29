interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  companies_slug_key: "A company with this name already exists. Please choose a different name.",
  companies_pkey: "This company already exists.",
  company_users_pkey: "This user is already a member of the company.",
  job_listings_pkey: "This job listing already exists.",
};

const PG_CODE_MESSAGES: Record<string, string> = {
  "23505": "A record with this information already exists.",
  "23503": "This operation references a record that doesn't exist.",
  "23502": "A required field is missing.",
  "42501": "You don't have permission to perform this action.",
};

export const parseSupabaseError = (err: unknown): string => {
  if (!err || typeof err !== "object") return "Something went wrong. Please try again.";
  const { code, message } = err as SupabaseErrorLike;
  if (message) {
    for (const [constraint, friendly] of Object.entries(CONSTRAINT_MESSAGES)) {
      if (message.includes(constraint)) return friendly;
    }
  }
  if (code && code in PG_CODE_MESSAGES) return PG_CODE_MESSAGES[code];
  return "Something went wrong. Please try again.";
};

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatSalary = (
  min: number | null,
  max: number | null,
  currency = "EUR"
): string => {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  if (min && max) return `${fmt.format(min)} – ${fmt.format(max)}`;
  if (min) return `From ${fmt.format(min)}`;
  if (max) return `Up to ${fmt.format(max)}`;
  return "Not specified";
};

export const formatDate = (date: string): string =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

export const timeAgo = (date: string): string => {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ] as const;

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
};

export const jobTypeLabels: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

export const experienceLevelLabels: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead",
  executive: "Executive",
};
