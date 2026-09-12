import type { Metadata } from "next";
import { EmberPrompt } from "./EmberPrompt";

export const metadata: Metadata = {
  title: "Ember / Prompt study — WebBuilder",
  description: "An independent Ember interface exploration.",
  robots: { index: false, follow: false },
};

export default function EmberPromptPage() {
  return <EmberPrompt />;
}
