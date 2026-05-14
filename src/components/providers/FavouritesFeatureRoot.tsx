import { FavouritesFeatureProvider } from "@/contexts/FavouritesFeatureContext";
import { getFavouritesEnabled } from "@/lib/favourites-feature";

export async function FavouritesFeatureRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  const enabled = await getFavouritesEnabled();
  return (
    <FavouritesFeatureProvider value={enabled}>{children}</FavouritesFeatureProvider>
  );
}
