export type { Database, Tables, TablesInsert, TablesUpdate, Json } from "./database";

export type JobType = "full-time" | "part-time" | "contract" | "internship" | "freelance";

export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";

export interface JobSearchFilters {
  q?: string;
  location?: string;
  type?: JobType;
  experience?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  totalPages: number;
}
