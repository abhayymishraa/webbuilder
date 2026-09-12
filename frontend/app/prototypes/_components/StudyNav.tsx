import Link from "next/link";
import styles from "./study-nav.module.css";

const studies = [
  { id: "prompt", href: "/prototypes/ember-prompt", label: "Prompt" },
  { id: "components", href: "/prototypes/ember-components", label: "Components" },
] as const;

export function StudyNav({ active }: { active: typeof studies[number]["id"] }) {
  return <header className={styles.header}>
    <Link href="/" className={styles.home}>webbuilder <span>/ studies</span></Link>
    <nav aria-label="Design studies">
      {studies.map(study => <Link key={study.id} href={study.href} aria-current={active === study.id ? "page" : undefined}>
        {study.label}
      </Link>)}
    </nav>
  </header>;
}
