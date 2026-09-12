import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/ember/Brand";
import styles from "./horizon-footer.module.css";

export function HorizonFooter() {
  return (
    <footer className={styles.footer} aria-labelledby="footer-heading">
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.content}>
        <h2 id="footer-heading">Your next idea deserves to exist.</h2>
        <p className={styles.description}>
          Start with a few words. Shape a working app, make it your own,
          and see where it takes you.
        </p>
      </div>
      <div className={styles.horizon} aria-hidden="true">
        <div className={styles.planet} />
      </div>
      <div className={styles.bottom}>
        <Brand />
        <nav aria-label="Footer">
          <a href="#how-it-works">How it works</a>
          <a href="#create">Write a brief</a>
          <a
            href="https://github.com/abhayymishraa/webbuilder"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
