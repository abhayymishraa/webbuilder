import styles from "@/components/landing/horizon-footer.module.css";
import { Brand } from "@/components/layout/Brand";
import { ArrowUpRight } from "lucide-react";

export function HorizonFooter() {
    return (
        <footer
            className={
                styles.footer +
                " horizon-footer [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-solid [&_a:focus-visible]:outline-ring [&_a:focus-visible]:outline-offset-[5px] pointer-fine:[&_a:hover]:opacity-80 pointer-fine:[&_a:focus-visible]:opacity-100 max-md:pt-8"
            }
            aria-labelledby="footer-heading"
        >
            <div className={styles.grid + " horizon-grid"} aria-hidden="true" />
            <div className="horizon-content max-w-170 mx-auto px-[clamp(16px,_4vw,_24px)] wrap-anywhere flex items-center flex-col text-center [&_h2]:max-w-[21ch] [&_h2]:m-0 [&_h2]:text-[clamp(30px,_3.4vw,_44px)] [&_h2]:font-medium [&_h2]:leading-[1.12] [&_h2]:tracking-[-.04em] [&_h2]:text-balance">
                <h2 id="footer-heading">Your next idea deserves to exist.</h2>
                <p className="horizon-description max-w-115 mt-4 mx-0 mb-0 text-muted-foreground text-[16px] leading-[1.65] text-pretty">
                    Start with a few words. Shape a working app, make it your own, and see where it
                    takes you.
                </p>
            </div>
            <div className={styles.horizon + " horizon-horizon"} aria-hidden="true">
                <div className={styles.planet + " horizon-planet"} />
            </div>
            <div className="horizon-bottom relative flex justify-between items-center flex-wrap gap-y-4 gap-x-8 max-w-305 mx-auto pt-4 px-[clamp(16px,_4vw,_48px)] pb-[max(24px,_env(safe-area-inset-bottom))] text-muted-foreground text-[13px] [&>a]:min-h-11 [&>a]:text-[20px] [&_nav]:flex [&_nav]:items-center [&_nav]:flex-wrap [&_nav]:gap-y-2 [&_nav]:gap-x-6 [&_nav_a]:inline-flex [&_nav_a]:items-center [&_nav_a]:gap-1.5 [&_nav_a]:min-h-11 [&_nav_a]:text-[inherit] [&_nav_a]:no-underline max-md:justify-center max-md:text-center max-md:[&_nav]:justify-center">
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
