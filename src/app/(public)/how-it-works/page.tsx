import { createStaticClient } from "@/lib/supabase/static";
import { HowItWorksContent } from "./HowItWorksContent";
import { getUserCount } from "@/services/stats.service";

export const revalidate = 86400;

export default async function HowItWorksPage() {
  const supabase = createStaticClient();
  const userCount = await getUserCount(supabase);

  return <HowItWorksContent userCount={userCount} />;
}
