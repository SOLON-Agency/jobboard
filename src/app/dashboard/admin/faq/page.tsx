import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/server-guards";
import { AdminFaqClient } from "./AdminFaqClient";

export const metadata: Metadata = {
  title: "Întrebări frecvente",
  robots: { index: false },
};

export default async function AdminFaqPage() {
  await requireAdminRole();
  return <AdminFaqClient />;
}
