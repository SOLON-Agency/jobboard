import { createStaticClient } from "@/lib/supabase/static";
import { HowItWorksContent } from "./HowItWorksContent";

export const revalidate = 86400;

export default async function HowItWorksPage() {
  const supabase = createStaticClient();
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return <HowItWorksContent userCount={count ?? 0} />;
}
