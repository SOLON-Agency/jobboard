import type { Metadata } from "next";
import { createStaticClient } from "@/lib/supabase/static";
import { HowItWorksContent } from "./HowItWorksContent";
import { getUserCount } from "@/services/stats.service";
import appSettings from "@/config/app.settings.json";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Cum funcționează",
  description: `Descoperă cum ${appSettings.name} te ajută să-ți găsești jobul juridic ideal sau să atragi talentele potrivite. Ghid pas cu pas pentru candidați și angajatori.`,
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: `Cum funcționează | ${appSettings.name}`,
    description: `Descoperă cum ${appSettings.name} conectează profesioniștii juridici cu angajatorii din România.`,
    url: "/how-it-works",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Cum funcționează | ${appSettings.name}`,
    description: `Descoperă cum ${appSettings.name} conectează profesioniștii juridici cu angajatorii din România.`,
  },
};

export default async function HowItWorksPage() {
  const supabase = createStaticClient();
  const userCount = await getUserCount(supabase);

  return <HowItWorksContent userCount={userCount} />;
}
