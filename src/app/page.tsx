import type { Metadata } from "next";
import { HeroSection } from "@/components/layout/HeroSection";
import { WhySection } from "@/components/layout/WhySection";
import { BannerSection } from "@/components/layout/BannerSection";
import { PlatformAdvantagesSection } from "@/components/marketing/PlatformAdvantagesSection";
import { AudienceSection } from "@/components/marketing/AudienceSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { BlogPreviewSection } from "@/components/marketing/BlogPreviewSection";
import { RecruitingAgenciesSection } from "@/components/marketing/RecruitingAgenciesSection";
import { NewsletterSection } from "@/components/newsletter/NewsletterSection";
import { createStaticClient } from "@/lib/supabase/static";
import { getPublicCounts } from "@/services/stats.service";
import appSettings from "@/config/app.settings.json";

// Revalidate once per day so counts stay fresh without a full redeploy
export const revalidate = 86400;

const SEO_TITLE = `${appSettings.name} — Recrutare juridică inteligentă în România`;
const SEO_DESCRIPTION =
  `${appSettings.name} este platforma premium de recrutare dedicată exclusiv pieței juridice din România: avocați, juriști, departamente in-house și agenții de recrutare. Matchmaking inteligent, alerte personalizate, transparență salarială, candidați verificați și conformitate GDPR. Publici până la 5 anunțuri complet gratuit.`;

export const metadata: Metadata = {
  title: "[TEST] " + SEO_TITLE,
  // title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords: [
    "joburi avocați România",
    "recrutare juridică",
    "avocat definitiv",
    "avocat stagiar",
    "consilier juridic",
    "in-house counsel",
    "joburi firme avocatură",
    "platformă carieră juridică",
    appSettings.name,
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: SEO_TITLE,
    description:
      "Platforma premium de carieră juridică din România. Matchmaking inteligent, transparență salarială și candidați verificați. Publici până la 5 anunțuri gratuit.",
    url: "/",
    type: "website",
    locale: "ro_RO",
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description:
      "Recrutare juridică inteligentă pentru avocați, juriști și echipe in-house. Matchmaking AI, alerte personalizate și 5 anunțuri gratuite.",
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
      <WhySection />
      <PlatformAdvantagesSection />
      <AudienceSection />
      <PricingSection />
      {/* <TestimonialsSection /> */}
      <RecruitingAgenciesSection />
      <FaqSection />
      <BannerSection />
      <BlogPreviewSection />
      <NewsletterSection />
    </>
  );
}
