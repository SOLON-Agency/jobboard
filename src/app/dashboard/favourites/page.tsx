import { notFound } from "next/navigation";
import { FavouritesClient } from "./FavouritesClient";
import { getFavouritesEnabled } from "@/lib/favourites-feature";

export const metadata = {
  title: "Favorite",
  robots: { index: false },
};

export default async function FavouritesPage() {
  if (!(await getFavouritesEnabled())) notFound();
  return <FavouritesClient />;
}
