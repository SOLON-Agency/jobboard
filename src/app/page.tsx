import type { Metadata } from "next";
import { HeroSection } from "@/components/layout/HeroSection";
import { FeaturesSection } from "@/components/layout/FeaturesSection";
import { createStaticClient } from "@/lib/supabase/static";
import { getPublicCounts } from "@/services/stats.service";
import appSettings from "@/config/app.settings.json";

// Revalidate once per day so counts stay fresh without a full redeploy
export const revalidate = 86400;

export const metadata: Metadata = {
  title: `${appSettings.name} — Platformă de carieră juridică`,
  description:
    "Găsește-ți următoarea oportunitate în cariera juridică. Răsfoiește sute de locuri de muncă de la cele mai bune firme de avocatură din România, aplică direct și gestionează-ți cariera.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${appSettings.name} — Platformă de carieră juridică`,
    description:
      "Platformă de carieră pentru profesioniști juridici din România. Locuri de muncă la firme de top, aplicare directă.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appSettings.name} — Platformă de carieră juridică`,
    description:
      "Platformă de carieră pentru profesioniști juridici din România.",
  },
};

export default async function HomePage() {
  const supabase = createStaticClient();
  const { jobs, companies, users } = await getPublicCounts(supabase);

  return (
    <>
      <HeroSection
        counts={{
          jobs: jobs * 2,
          companies,
          users: users * 2,
        }}
      />
      <FeaturesSection />
    </>
  );
}
