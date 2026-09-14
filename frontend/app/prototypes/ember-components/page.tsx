import type { Metadata } from "next";
import { StudyNav } from "../_components/StudyNav";
import { ArchitectureStudy } from "@/components/ember/landing/ArchitectureStudy";
import { AssemblyStudy } from "@/components/ember/landing/AssemblyStudy";
import { FilterStudy } from "@/components/ember/landing/FilterStudy";
import styles from "@/components/ember/landing/studies.module.css";

export const metadata: Metadata = {
  title: "Ember component studies | WebBuilder",
  description:
    "Three interactive Ember illustrations, built as independent frontend components.",
  robots: { index: false, follow: false },
};

export default function EmberComponentsPage() {
  return (
    <main
      className={
        styles.page +
        " studies-page [&_a]:text-[inherit] [&_a]:no-underline [&_.studies-section]:max-w-290 [&_.studies-section]:py-10 [&_.studies-section]:px-8 [&_.studies-section]:min-h-0 [&_.studies-section_h1]:text-[clamp(28px,_3.4vw,_40px)] [&_.studies-section_h2]:text-[clamp(28px,_3.4vw,_40px)] [&_.studies-assembly]:border-t-0 [&_.studies-filter]:border-t-0 [&_.studies-footer]:max-w-290 [&_.studies-footer]:px-8 [&_.studies-footer]:border-t-0 max-md:[&_.studies-section]:px-5.5 max-md:[&_.studies-footer]:px-5.5"
      }
    >
      <a
        className="studies-skip absolute left-5 -top-20 z-20 p-3 bg-[#231710] [&:focus]:top-[15px]"
        href="#architecture"
      >
        Skip to components
      </a>
      <StudyNav active="components" />
      <ArchitectureStudy />
      <AssemblyStudy />
      <FilterStudy />
      <footer className="studies-footer max-w-320 m-auto py-7.5 px-[4%] flex justify-between gap-5 text-[var(--study-muted)] text-[12px] leading-[1.6] border-t border-t-[var(--study-border,_#2a221d)] [&_p]:m-0 max-md:py-[25px] max-md:px-6 max-md:flex-col max-md:gap-2.5">
        <p>
          Independent frontend studies. All interactions are local
          demonstrations.
        </p>
      </footer>
    </main>
  );
}
