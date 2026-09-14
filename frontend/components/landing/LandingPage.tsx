import { ArchitectureStudy } from "@/components/landing/ArchitectureStudy";
import { AssemblyStudy } from "@/components/landing/AssemblyStudy";
import { FaqItem } from "@/components/landing/FaqItem";
import { HeroPrompt } from "@/components/landing/HeroPrompt";
import { HorizonFooter } from "@/components/landing/HorizonFooter";
import { ProjectShowcase } from "@/components/landing/ProjectShowcase";
import studyStyles from "@/components/landing/studies.module.css";
import { Brand } from "@/components/layout/Brand";
import { ThemeToggle } from "@/components/layout/ThemeProvider";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

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

export default function LandingPage() {
    return (
        <>
            <a
                className="ember-skip fixed top-2 left-2 z-100 py-3 px-4.5 bg-primary text-black -translate-y-[160%] rounded-[8px] focus:transform-none"
                href="#main-content"
            >
                Skip to content
            </a>
            <header className="ember-nav m-auto flex items-center justify-between [&_nav]:flex [&_nav]:gap-6.5 [&_nav]:text-[13px] [&_nav]:text-muted-foreground max-md:min-h-19 max-md:[&_nav]:hidden ember-landing-nav max-w-305 min-h-19 py-3.5 px-[clamp(16px,_4vw,_48px)] gap-4 border-0 flex-wrap [&>.ember-row]:gap-[clamp(8px,_1.4vw,_14px)] [&>.ember-row]:ml-auto [&_:is(.ember-brand,_.ember-text-link,_nav_a)]:min-h-11 [&_:is(.ember-brand,_.ember-text-link,_nav_a)]:inline-flex [&_:is(.ember-brand,_.ember-text-link,_nav_a)]:items-center [&_.ember-icon]:w-11 [&_.ember-icon]:h-11 [&_nav_a]:whitespace-nowrap max-[961px]:[&_nav]:hidden max-md:[&_.ember-brand]:text-[20px] max-md:[&_.ember-brand]:gap-2">
                <Brand />
                <nav aria-label="Main navigation">
                    <a href="#how-it-works">How it works</a>
                </nav>
                <div className="ember-row flex items-center gap-3.5">
                    <ThemeToggle />
                    <Link
                        className="ember-text-link inline-flex items-center gap-2 text-[13px] bg-transparent border-0 text-secondary-foreground no-underline pointer-fine:hover:text-foreground"
                        href="/signin"
                    >
                        Sign in
                    </Link>
                    <Link
                        className={buttonVariants({
                            variant: "default",
                            className: "ember-nav-cta max-md:hidden",
                        })}
                        href="/chat"
                    >
                        Open workspace <ArrowUpRight size={16} />
                    </Link>
                </div>
            </header>
            <main
                id="main-content"
                className={`ember-landing max-w-305 m-auto py-0 px-[clamp(16px,_4vw,_48px)] wrap-anywhere [&_:is(section,_section>div)]:min-w-0 [&_h2]:max-w-[20ch] [&_h2]:text-balance [&_h2]:text-[clamp(28px,_2.8vw,_36px)] [&_h2]:leading-[1.15] [&_h2]:font-medium [&_h2]:tracking-[-.04em] ${studyStyles.integration} studies-integration [&_.studies-section]:max-w-none [&_.studies-section]:px-0 [&_.studies-section_em]:[font-family:inherit] [&_.studies-section_h2]:max-w-[20ch] [&_.studies-section_h2]:text-[clamp(28px,_2.8vw,_36px)] [&_.studies-section_h2]:leading-[1.15] [&_.studies-section_h2]:font-medium [&_.studies-section_h2]:tracking-[-.04em] [&_.studies-architectureHero]:min-h-[calc(100svh_-_76px)] [&_.studies-architectureHero]:grid-cols-[minmax(0,_1.1fr)_minmax(0,_.9fr)] [&_.studies-architectureHero]:gap-12 [&_.studies-architectureHero]:py-8 [&_.studies-assembly]:border-t-0 [&_.studies-assembly]:min-h-0 [&_.studies-assembly]:py-14 [&_.studies-assembly]:grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)] [&_.studies-assembly]:gap-12 [&_.studies-cubeVisual]:w-[min(320px,_100%)] [&_.studies-accentIcon]:hidden [&_.studies-intro]:max-w-97.5 max-md:[&_.studies-architectureHero]:grid-cols-[minmax(0,_1fr)] max-md:[&_.studies-architectureHero]:[align-content:center] max-md:[&_.studies-architectureHero]:gap-3 max-md:[&_.studies-architectureHero]:py-6 max-md:[&_.studies-assembly]:grid-cols-[minmax(0,_1fr)] max-md:[&_.studies-assembly]:gap-6 max-md:[&_.studies-assembly]:py-10 max-md:[&_.studies-cubeVisual]:w-[min(280px,_100%)] [@media(min-width:_600px)_and_(max-width:_767px)_and_(max-height:_500px)]:[&_.studies-architectureHero]:grid-cols-[minmax(0,_1fr)_minmax(160px,_.6fr)] [@media(min-width:_600px)_and_(max-width:_767px)_and_(max-height:_500px)]:[&_.studies-architectureHero]:gap-6`}
            >
                <ArchitectureStudy />
                <ProjectShowcase />
                <AssemblyStudy />
                <section className="ember-landing-section py-14 px-0 scroll-mt-7.5 max-md:py-10 max-md:px-0 ember-faq grid grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)] gap-12 [&_details]:border-b [&_details]:border-b-border [&_summary]:list-none [&_summary]:flex [&_summary]:items-center [&_summary]:justify-between [&_summary]:gap-5 [&_summary]:text-[15px] [&_summary]:font-medium [&_summary]:py-4.5 [&_summary]:px-0 [&_summary::-webkit-details-marker]:hidden [&_summary>span]:shrink-0 [&_details[open]_summary>span]:rotate-45 [&_details_p]:text-[14px] [&_details_p]:leading-[1.8] [&_details_p]:text-muted-foreground [&_details_p]:pb-5.5 max-[1001px]:gap-10 max-md:grid-cols-[1fr] max-md:gap-[35px]">
                    <h2>A few useful answers.</h2>
                    <div>
                        {questions.map(([question, answer]) => (
                            <FaqItem key={question} question={question} answer={answer} />
                        ))}
                    </div>
                </section>
                <section
                    id="create"
                    className="ember-hero grid grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)] gap-12 items-center py-14 px-0 [&_h2_span]:text-accent-foreground max-[1001px]:gap-8 max-[961px]:grid-cols-[minmax(0,_1fr)] max-[961px]:gap-6 max-md:grid-cols-[1fr] max-md:pt-8 max-md:px-0 max-md:pb-11 max-md:gap-5"
                    aria-labelledby="create-heading"
                >
                    <div>
                        <p className="ember-eyebrow uppercase tracking-[0.12em] text-[10px] font-medium text-accent-foreground mb-5.5">
                            From idea to interface
                        </p>
                        <h2 id="create-heading">
                            Make room for <span>your next idea.</span>
                        </h2>
                        <p className="ember-hero-description text-[15px] leading-[1.65] max-w-97.5 mt-5 mx-0 mb-0 text-secondary-foreground max-[961px]:max-w-[52ch] max-md:text-[15px] max-md:mt-4.5 max-md:mx-0 max-md:mb-0">
                            Describe an app. Shape it in conversation. Keep every line of code.
                        </p>
                    </div>
                    <HeroPrompt />
                </section>
            </main>
            <HorizonFooter />
        </>
    );
}
