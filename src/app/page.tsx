import { HeroSection } from "@/components/layout/HeroSection";
import { FeaturesSection } from "@/components/layout/FeaturesSection";
import { createStaticClient } from "@/lib/supabase/static";
import { getPublicCounts } from "@/services/stats.service";

// Revalidate once per day so counts stay fresh without a full redeploy
export const revalidate = 86400;

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
