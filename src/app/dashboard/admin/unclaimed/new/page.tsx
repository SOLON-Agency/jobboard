import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/server-guards";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { UnclaimedNewClient } from "./UnclaimedNewClient";

export const metadata: Metadata = {
  title: "Companie nerevendicată — nou",
  robots: { index: false },
};

export default async function UnclaimedNewPage() {
  await requireAdminRole();

  return (
    <>
      <DashboardPageHeader
        title="Adaugă companie nerevendicată"
        subtitle="Creează o companie și un anunț în numele unui angajator care nu este încă pe platformă. Un email de invitație va fi trimis automat."
      />
      <UnclaimedNewClient />
    </>
  );
}
