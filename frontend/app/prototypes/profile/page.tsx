import type { Metadata } from "next";
import ProfilePrototype from "./ProfilePrototype";

export const metadata: Metadata = {
  title: "Profile studies | WebBuilder",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProfilePrototype />;
}
