import { FavouritesClient } from "./FavouritesClient";

export const metadata = {
  title: "Favorite",
  robots: { index: false },
};

export default function FavouritesPage() {
  return <FavouritesClient />;
}
