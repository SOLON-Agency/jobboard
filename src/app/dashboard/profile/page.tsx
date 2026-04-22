import type { Metadata } from "next";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profilul meu",
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
