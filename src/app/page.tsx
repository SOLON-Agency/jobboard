import { HeroSection } from "@/components/layout/HeroSection";
import { FeaturesSection } from "@/components/layout/FeaturesSection";
import { createStaticClient } from "@/lib/supabase/static";

// Revalidate once per day so counts stay fresh without a full redeploy
export const revalidate = 86400;

export default async function HomePage() {
  const supabase = createStaticClient();

  const [{ count: jobs }, { count: companies }, { count: users }] =
    await Promise.all([
      supabase.from("job_listings").select("*", { count: "exact", head: true }),
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

  return (
    <>
      <HeroSection
        counts={{
          jobs: (jobs ?? 0) * 2,
          companies: companies ?? 0,
          users: (users ?? 0) * 2,
        }}
      />
      <FeaturesSection />
    </>
  );
}
