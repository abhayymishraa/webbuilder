"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArchitectureTilt } from "./ArchitectureTilt";
import styles from "./studies.module.css";

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

function WirePlate({ y, width = 120 }: { y: number; width?: number }) {
  return (
    <g transform={`translate(300 ${y})`}>
      <path
        d={`M ${-width} 0 0 -48 ${width} 0 0 48 Z`}
        fill="var(--diagram-surface, #12100f)"
      />
      <path
        d={`M ${-width} 0 v18 L0 66 ${width} 18 V0 M0 48 v18`}
        fill="none"
      />
      <path
        d={`M ${-width + 22} 0 0 -38 ${width - 22} 0 0 38 Z`}
        fill="none"
        opacity=".3"
      />
    </g>
  );
}

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
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
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
        <svg
          id={`${id}-diagram`}
          className="studies-archSvg block w-full h-auto aspect-[2_/_3] [overflow:visible]"
          viewBox="0 0 600 900"
          role="img"
          aria-label={`Exploded architecture. Highlighted layer: ${layers[active].name}.`}
        >
          <defs>
            <radialGradient id={`${id}-halo`}>
              <stop stopColor="#ff6129" stopOpacity=".15" />
              <stop offset="1" stopColor="#ff6129" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse
            cx="300"
            cy="450"
            rx="270"
            ry="230"
            fill={`url(#${id}-halo)`}
          />
          <g
            fill="none"
            stroke="var(--diagram-ink, #d5c9c0)"
            strokeWidth=".65"
            opacity=".22"
          >
            <path d="M90 -30 Q300 130 300 450 T70 930 M510 -30 Q300 130 300 450 T530 930 M215 -30 Q350 350 270 650 T180 930" />
            <path d="M300 70 V840" strokeDasharray="3 8" />
          </g>
          <g
            className={
              styles.archLayer +
              " studies-archLayer [&[data-active=true]]:text-[var(--diagram-highlight,_#edc8b2)]"
            }
            data-active={active === 0}
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          >
            <g className={styles.archFloatTop + " studies-archFloatTop"}>
              <WirePlate y={133} width={95} />
              <g
                transform="translate(300 118)"
                fill="var(--diagram-surface, #100e0d)"
              >
                <circle r="24" />
                <circle r="17" opacity=".4" />
                <path
                  d="M-7 -9 0 -13 7 -9 v10 Q7 8 0 12 Q-7 8 -7 1Z"
                  fill="currentColor"
                  stroke="none"
                />
              </g>
              {[-1, 1].map((sign) => (
                <g
                  key={sign}
                  transform={`translate(${300 + sign * 70} 123)`}
                  fill="var(--diagram-panel, #151210)"
                >
                  <path d="M-10 0 0 -5 10 0 V16 L0 21 -10 16 Z M0 5 V21 M-10 0 0 5 10 0" />
                </g>
              ))}
              <WirePlate y={230} width={119} />
              <path d="M300 180 V208 M280 181 V201 M320 181 V201" />
              <g
                transform="translate(256 224)"
                stroke="none"
                fill="currentColor"
              >
                <text fontSize="9" letterSpacing="2">
                  THE BRIEF
                </text>
              </g>
            </g>
            <path d="M505 104 h15 v176 h-15" fill="none" />
            <text
              x="543"
              y="190"
              transform="rotate(90 543 190)"
              textAnchor="middle"
              stroke="none"
              fill="currentColor"
              fontSize="16"
              letterSpacing="1"
            >
              YOUR PROMPT
            </text>
          </g>
          <g
            className={
              styles.archLayer +
              " studies-archLayer [&[data-active=true]]:text-[var(--diagram-highlight,_#edc8b2)]"
            }
            data-active={active === 1}
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          >
            <WirePlate y={327} width={142} />
            <g fill="none" opacity=".65">
              <path d="M152 348 C28 346 20 579 160 600 M448 348 C572 346 580 579 440 600 M153 386 C67 374 61 547 156 554 M447 386 C533 374 539 547 444 554" />
              <path d="M132 354 v-42 h-29 M468 354 v-42 h29 M130 566 v50 h-24 M470 566 v50 h24" />
            </g>
            <g fill="currentColor" stroke="none">
              {[
                [103, 312],
                [497, 312],
                [106, 616],
                [494, 616],
              ].map(([x, y]) => (
                <circle key={x} cx={x} cy={y} r="3" />
              ))}
            </g>
            <path
              d="M159 387 300 332 441 387 V553 L300 610 159 553Z"
              fill="var(--diagram-surface, #100e0d)"
            />
            <path
              d="M300 332 V610 M169 396 289 350 V587 L169 541Z"
              fill="var(--diagram-panel, #1c1714)"
            />
            <path
              d="M181 423 277 386 V473 L181 510Z"
              fill="var(--diagram-surface, #080706)"
            />
            {Array.from({ length: 6 }, (_, i) => (
              <path
                key={i}
                d={`M190 ${443 + i * 9} l${i % 2 === 0 ? 61 : 40} -${i % 2 === 0 ? 24 : 16}`}
                opacity={i < 3 ? 0.9 : 0.3}
              />
            ))}
            {Array.from({ length: 23 }, (_, i) => (
              <path key={i} d={`M306 ${348 + i * 10} l126 50`} opacity=".32" />
            ))}
            <path
              d="M191 406 l18 -7 m8 -3 18 -7 m8 -3 18 -7 M187 532 l40 -16 m12 -5 29 -11"
              strokeWidth="3"
            />
            <path
              d="M350 431 367 424 384 431 V452 L367 459 350 452Z M367 438 V459 M350 431 367 438 384 431"
              fill="var(--diagram-surface, #16100d)"
            />
            <WirePlate y={617} width={142} />
            <path d="M505 307 h24 v362 h-24" fill="none" />
            <text
              x="550"
              y="490"
              transform="rotate(90 550 490)"
              textAnchor="middle"
              stroke="none"
              fill="currentColor"
              fontSize="16"
              letterSpacing="1"
            >
              BUILD &amp; CHECK
            </text>
          </g>
          <g
            fill="none"
            stroke="#ff6129"
            opacity={active === 1 ? 0.9 : 0.25}
            className={styles.orbit + " studies-orbit"}
          >
            <ellipse
              cx="299"
              cy="480"
              rx="257"
              ry="66"
              transform="rotate(-13 299 480)"
            />
            <ellipse
              cx="299"
              cy="480"
              rx="194"
              ry="42"
              transform="rotate(-13 299 480)"
              strokeDasharray="3 5"
            />
            {/* Project a rotating circle onto the ellipse, then undo the rotation
              and projection around the marker so it stays round throughout. */}
            <g
              transform={`translate(299 480) rotate(-13) scale(1 ${66 / 257})`}
            >
              <g className={styles.orbitRotor + " studies-orbitRotor"}>
                <g transform="translate(-257 0)">
                  <g
                    className={
                      styles.orbitCounterRotor + " studies-orbitCounterRotor"
                    }
                  >
                    <g
                      transform={`scale(1 ${257 / 66})`}
                      stroke="none"
                      fill="#ff7145"
                    >
                      <circle r="11" opacity=".16" />
                      <circle r="5" />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
          <g
            className={
              styles.archLayer +
              " studies-archLayer [&[data-active=true]]:text-[var(--diagram-highlight,_#edc8b2)]"
            }
            data-active={active === 2}
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          >
            <g className={styles.archFloatBottom + " studies-archFloatBottom"}>
              <WirePlate y={730} width={109} />
              <path
                d="M205 752 v64 L300 853 395 816 V752 M300 787 V853"
                fill="var(--diagram-surface, #100e0d)"
              />
              <path
                d="M226 773 l48 19 v15 l-48 -19Z M325 792 l48 -19 v15 l-48 19Z"
                fill="none"
              />
              <ellipse
                cx="300"
                cy="811"
                rx="17"
                ry="21"
                fill="var(--diagram-surface, #100e0d)"
              />
              <ellipse cx="300" cy="811" rx="7" ry="21" fill="none" />
              <path d="M283 811 h34" />
              <path
                d="M169 727 C105 700 89 809 197 813 M431 727 C495 700 511 809 403 813 M505 715 h15 v146 h-15"
                fill="none"
                opacity=".65"
              />
            </g>
            <text
              x="543"
              y="790"
              transform="rotate(90 543 790)"
              textAnchor="middle"
              stroke="none"
              fill="currentColor"
              fontSize="16"
              letterSpacing="1"
            >
              PREVIEW
            </text>
          </g>
        </svg>
      </ArchitectureTilt>
    </section>
  );
}
