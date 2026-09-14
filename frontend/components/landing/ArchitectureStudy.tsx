"use client";

import { ArchitectureDiagram } from "./ArchitectureDiagram";

import { ArchitectureTilt } from "@/components/landing/ArchitectureTilt";
import styles from "@/components/landing/studies.module.css";
import { useEffect, useId, useRef, useState } from "react";

const layers = [
    {
        name: "Your prompt",
        description:
            "Describe your app in your own words. Start with the people it is for and what it should do.",
    },
    {
        name: "Build & check",
        description:
            "WebBuilder edits the source, runs a build, and checks the preview. Follow the progress in your workspace.",
    },
    {
        name: "Preview",
        description:
            "Try the interface, inspect the code, and describe your next change. Keep shaping the same app.",
    },
];

export function ArchitectureStudy() {
    const [active, setActive] = useState(1);
    const [visible, setVisible] = useState(false);
    const section = useRef<HTMLElement>(null);
    const id = useId();

    useEffect(() => {
        if (!section.current) return;
        let inView = !("IntersectionObserver" in window);
        const updateVisibility = () => setVisible(inView && !document.hidden);
        const observer =
            "IntersectionObserver" in window
                ? new IntersectionObserver(([entry]) => {
                      inView = entry.isIntersecting;
                      updateVisibility();
                  })
                : null;
        observer?.observe(section.current);
        document.addEventListener("visibilitychange", updateVisibility);
        updateVisibility();
        return () => {
            observer?.disconnect();
            document.removeEventListener("visibilitychange", updateVisibility);
        };
    }, []);

    return (
        <section
            ref={section}
            id="how-it-works"
            data-motion-running={visible}
            className={`studies-section relative max-w-270 m-auto scroll-mt-6 [&_h1]:text-[clamp(32px,_3.5vw,_44px)] [&_h1]:font-normal [&_h1]:leading-[1.1] [&_h1]:tracking-[-.045em] [&_h1]:m-0 [&_h1]:text-balance [&_h2]:text-[clamp(32px,_3.5vw,_44px)] [&_h2]:font-normal [&_h2]:leading-[1.1] [&_h2]:tracking-[-.045em] [&_h2]:m-0 [&_h2]:text-balance [&_em]:[font-family:"Iowan_Old_Style",_"Palatino_Linotype",_"Book_Antiqua",_Georgia,_serif] [&_em]:font-normal [&_em]:tracking-[-.045em] [&_em]:leading-[1.17] max-md:[&_h1]:text-[clamp(30px,_7.5vw,_38px)] max-md:[&_h2]:text-[clamp(30px,_7.5vw,_38px)] studies-architecture min-h-132.5 grid grid-cols-[1.1fr_.9fr] items-center gap-8 py-9 px-[5%] max-md:grid-cols-[1fr] max-md:py-7.5 max-md:px-6 max-md:min-h-auto max-md:gap-4 ${styles.architectureHero} studies-architectureHero [&_h1]:max-w-[15ch] [&_h1]:text-[clamp(36px,_4.2vw,_54px)] [&_h1]:font-medium [&_h1]:leading-[1.08] [&_.studies-archCopy_h1_em]:text-[inherit] [&_.studies-archCopy_h1_em]:p-0 [&_.studies-kicker]:font-mono [&_.studies-intro]:text-[16px] [&_.studies-intro]:my-6 [&_.studies-layerDescription]:max-w-105 [&_.studies-layerDescription]:min-h-0 [&_.studies-layerDescription]:text-[14px] [&_.studies-archVisual]:w-[min(100%,_clamp(200px,_44svh,_360px))] max-md:[&_h1]:text-[clamp(32px,_8vw,_44px)] max-md:[&_.studies-intro]:text-[14px] max-md:[&_.studies-intro]:my-4 max-md:[&_.studies-layerDescription]:text-[13px] max-md:[&_.studies-archVisual]:w-[min(100%,_clamp(160px,_22svh,_200px))] [@media(min-width:_600px)_and_(max-width:_767px)_and_(max-height:_500px)]:[&_.studies-archVisual]:w-[min(100%,_200px)]`}
            aria-labelledby={`${id}-heading`}
        >
            <div className="studies-archCopy relative z-1 min-w-0 [&_h1_em]:[display:inline-block] [&_h1_em]:pb-[5px] [&_h1_em]:text-[var(--study-accent)] max-md:p-0">
                <p className={styles.kicker + " studies-kicker max-md:mb-4"}>
                    How WebBuilder works
                </p>
                <h1 id={`${id}-heading`}>
                    From your prompt to your <em>preview.</em>
                </h1>
                <p className="studies-intro text-[var(--study-muted)] text-[15px] leading-[1.65] max-w-87.5 my-4.5 mx-0 text-pretty max-md:text-[14px]">
                    Describe it. Follow the build. Try it for yourself.
                </p>
                <ol
                    className="studies-steps flex flex-wrap gap-y-4 gap-x-6 list-none p-0 my-6 mx-0 text-[var(--study-muted)] text-[14px] [&_li]:flex [&_li]:items-baseline [&_li]:gap-2 [&_button]:inline-flex [&_button]:items-baseline [&_button]:gap-2 [&_button]:min-h-11 [&_button]:py-1 [&_button]:px-0 [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[inherit] [&_button]:text-left [&_button[aria-pressed=true]]:text-[var(--study-text)] pointer-fine:[&_button:hover]:text-[var(--study-accent)] [&_li_span]:text-[var(--study-accent)] [&_li_span]:[font:11px_monospace] max-md:gap-y-3 max-md:gap-x-4 max-md:text-[13px] max-md:my-5"
                    aria-label="How your app takes shape"
                >
                    {layers.map((layer, index) => (
                        <li key={layer.name}>
                            <button
                                type="button"
                                aria-pressed={active === index}
                                onClick={() => setActive(index)}
                            >
                                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                                {layer.name}
                            </button>
                        </li>
                    ))}
                </ol>
                <p
                    className="studies-layerDescription text-[var(--study-muted)] text-[13px] leading-[1.7] max-w-87.5 min-h-17 m-0 max-md:max-w-full max-md:min-h-17.5"
                    aria-live="polite"
                >
                    {layers[active].description}
                </p>
            </div>
            <ArchitectureTilt enabled={visible}>
                <ArchitectureDiagram id={id} active={active} activeName={layers[active].name} />
            </ArchitectureTilt>
        </section>
    );
}
