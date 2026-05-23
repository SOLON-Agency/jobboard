import type { Metadata } from "next";
import { formatPageTitle, buildTitleTemplate } from "@/lib/page-title";
import appSettings from "@/config/app.settings.json";

export const metadata: Metadata = {
  title: {
    default: formatPageTitle(`${appSettings.name} — Cum funcționează`),
    template: buildTitleTemplate(appSettings.name),
  },
  description:
    `Află cum să folosești ${appSettings.name} pentru a-ți găsi următoarea oportunitate în cariera juridică.`,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    siteName: appSettings.name,
    title: formatPageTitle(`${appSettings.name} — Platformă de carieră juridică`),
    description:
      `Află cum să folosești ${appSettings.name} pentru a-ți găsi următoarea oportunitate în cariera juridică.`,
  },
  twitter: {
    card: "summary_large_image",
    title: formatPageTitle(`${appSettings.name} — Platformă de carieră juridică`),
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
