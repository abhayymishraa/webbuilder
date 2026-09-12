import type { Metadata } from "next";
import { StudyNav } from "../_components/StudyNav";
import { ArchitectureStudy } from "@/components/ember/landing/ArchitectureStudy";
import { AssemblyStudy } from "@/components/ember/landing/AssemblyStudy";
import { FilterStudy } from "@/components/ember/landing/FilterStudy";
import styles from "@/components/ember/landing/studies.module.css";

export const metadata: Metadata = {
  title: "Ember component studies | WebBuilder",
  description: "Three interactive Ember illustrations, built as independent frontend components.",
  robots: { index: false, follow: false },
};

export default function EmberComponentsPage() {
  return (
    <main className={styles.page}>
      <a className={styles.skip} href="#architecture">Skip to components</a>
      <StudyNav active="components" />
      <ArchitectureStudy />
      <AssemblyStudy />
      <FilterStudy />
      <footer className={styles.footer}>
        <p>Independent frontend studies. All interactions are local demonstrations.</p>
      </footer>
    </main>
  );
}
