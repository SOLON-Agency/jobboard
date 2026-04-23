import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/server-guards";
import { AdminSkillsClient } from "./AdminSkillsClient";

export const metadata: Metadata = {
  title: "Administrare competențe",
  robots: { index: false },
};

export default async function AdminSkillsPage() {
  await requireAdminRole();
  return <AdminSkillsClient />;
}
