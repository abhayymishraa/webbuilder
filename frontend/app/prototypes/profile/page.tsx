import ProfilePrototype from "@/components/prototypes/profile/ProfilePrototype";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Profile studies | WebBuilder",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <ProfilePrototype />;
}
