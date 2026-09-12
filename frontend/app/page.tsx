import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/ember/Brand";
import { ThemeToggle } from "@/components/ember/ThemeProvider";
import { HeroPrompt } from "@/components/ember/landing/HeroPrompt";
import { HorizonFooter } from "@/components/ember/landing/HorizonFooter";
import { ArchitectureStudy } from "@/components/ember/landing/ArchitectureStudy";
import { AssemblyStudy } from "@/components/ember/landing/AssemblyStudy";
import { ProjectShowcase } from "@/components/ember/landing/ProjectShowcase";
import { FaqItem } from "@/components/ember/landing/FaqItem";
import studyStyles from "@/components/ember/landing/studies.module.css";
import "./page-styles.css";

const questions = [
  [
    "What can I build?",
    "Describe a React web app: a personal tool, a portfolio, a dashboard, or an idea you want to try. Start with the person using it and the first thing they should be able to do.",
  ],
  [
    "Can I change the result?",
    "Yes. Continue the conversation in the same project to request changes, then try the updated app in its preview.",
  ],
  [
    "Can I take the code with me?",
    "Open Files to inspect the source. Download an individual file or the project ZIP to keep working in your own development environment.",
  ],
  [
    "What happens when I stop a run?",
    "Stop requests cancellation of the active run. The activity records its outcome, and you can send another request when it has ended.",
  ],
  [
    "How does usage work?",
    "Your account shows its remaining generation balance. A build uses the connected model and sandbox services. Browsing the starter concepts does not start a build or use generation credits.",
  ],
];

export default function Home() {
  return (
    <>
      <a className="ember-skip" href="#main-content">
        Skip to content
      </a>
      <header className="ember-nav ember-landing-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="ember-row">
          <ThemeToggle />
          <Link className="ember-text-link" href="/signin">
            Sign in
          </Link>
          <Link className="ember-button ember-nav-cta" href="/chat">
            Open workspace <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main id="main-content" className={`ember-landing ${studyStyles.integration}`}>
        <ArchitectureStudy id="how-it-works" hero />
        <ProjectShowcase />
        <AssemblyStudy ownership />
        <section className="ember-landing-section ember-faq">
          <h2>A few useful answers.</h2>
          <div>
            {questions.map(([question, answer]) => (
              <FaqItem key={question} question={question} answer={answer} />
            ))}
          </div>
        </section>
        <section id="create" className="ember-hero" aria-labelledby="create-heading">
          <div>
            <p className="ember-eyebrow">From idea to interface</p>
            <h2 id="create-heading">
              Make room for{" "}
              <span>your next idea.</span>
            </h2>
            <p className="ember-hero-description">
              Describe an app. Shape it in conversation. Keep every line of
              code.
            </p>
          </div>
          <HeroPrompt />
        </section>
      </main>
      <HorizonFooter />
    </>
  );
}
