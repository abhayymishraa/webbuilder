"use client";

import styles from "@/components/landing/studies.module.css";
import { Layers3 } from "lucide-react";
import { useId } from "react";

function Cube({
    x,
    y,
    size,
    accent = false,
}: {
    x: number;
    y: number;
    size: number;
    accent?: boolean;
}) {
    const h = size * 0.48;
    return (
        <g
            transform={`translate(${x} ${y})`}
            stroke={accent ? "#ff966f" : "#fff4ea"}
            strokeOpacity=".4"
            strokeWidth=".8"
            strokeLinejoin="round"
        >
            <path
                d={`M0 0 ${size} ${h} 0 ${h * 2} ${-size} ${h}Z`}
                fill={accent ? "#ff8e5e" : "#e0d9d3"}
            />
            <path
                d={`M${-size} ${h} 0 ${h * 2} V${h * 2 + size} L${-size} ${h + size}Z`}
                fill={accent ? "#b64017" : "#83776f"}
            />
            <path
                d={`M0 ${h * 2} ${size} ${h} V${h + size} L0 ${h * 2 + size}Z`}
                fill={accent ? "#f3632d" : "#beb3a9"}
            />
        </g>
    );
}

export function AssemblyStudy() {
    const id = useId();

    return (
        <section
            id="assembly"
            className={`studies-section relative max-w-270 m-auto scroll-mt-6 [&_h1]:text-[clamp(32px,_3.5vw,_44px)] [&_h1]:font-normal [&_h1]:leading-[1.1] [&_h1]:tracking-[-.045em] [&_h1]:m-0 [&_h1]:text-balance [&_h2]:text-[clamp(32px,_3.5vw,_44px)] [&_h2]:font-normal [&_h2]:leading-[1.1] [&_h2]:tracking-[-.045em] [&_h2]:m-0 [&_h2]:text-balance [&_em]:[font-family:"Iowan_Old_Style",_"Palatino_Linotype",_"Book_Antiqua",_Georgia,_serif] [&_em]:font-normal [&_em]:tracking-[-.045em] [&_em]:leading-[1.17] max-md:[&_h1]:text-[clamp(30px,_7.5vw,_38px)] max-md:[&_h2]:text-[clamp(30px,_7.5vw,_38px)] studies-assembly grid grid-cols-[1fr_1fr] gap-12 items-center min-h-122.5 py-9 px-[5%] border-t border-t-[var(--study-border,_#2a221d)] max-md:grid-cols-[1fr] max-md:py-7.5 max-md:px-6 max-md:min-h-auto max-md:gap-4.5`}
            aria-labelledby={`${id}-heading`}
        >
            <div
                data-scroll="true"
                className={
                    styles.cubeVisual +
                    " studies-cubeVisual min-w-0 w-[min(100%,_400px)] m-auto max-md:w-[min(100%,_300px)] max-md:m-auto"
                }
            >
                <svg
                    viewBox="0 0 680 690"
                    role="img"
                    aria-label="Layout, style, content, and interactions form an app around an orange core"
                    className={
                        styles.cubeSvg +
                        " studies-cubeSvg block w-full h-auto aspect-[68_/_69] [overflow:visible]"
                    }
                >
                    <defs>
                        <radialGradient id={`${id}-light`}>
                            <stop stopColor="#ff6129" stopOpacity=".28" />
                            <stop offset="1" stopColor="#ff6129" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id={`${id}-glass`} x1="0" x2="1" y2="1">
                            <stop stopColor="#fff5eb" stopOpacity=".2" />
                            <stop offset=".45" stopColor="#fff5eb" stopOpacity=".025" />
                            <stop offset="1" stopColor="#ff8b5d" stopOpacity=".14" />
                        </linearGradient>
                        <pattern
                            id={`${id}-grid`}
                            width="34"
                            height="34"
                            patternUnits="userSpaceOnUse"
                        >
                            <path d="M34 0H0V34" fill="none" stroke="#c2a491" strokeOpacity=".08" />
                        </pattern>
                    </defs>
                    <circle cx="340" cy="370" r="320" fill={`url(#${id}-light)`} />
                    <rect x="100" y="100" width="480" height="480" fill={`url(#${id}-grid)`} />
                    <ellipse cx="340" cy="578" rx="177" ry="48" fill="#000" opacity=".3" />
                    <g stroke="#ff7145" fill="none" strokeWidth="1" opacity=".3">
                        <path
                            d="M340 149V553 M150 245 530 430 M530 245 150 430"
                            strokeDasharray="4 8"
                        />
                        <path d="M143 242 340 146 537 242 V463 L340 560 143 463Z M143 242 340 338 537 242 M340 338 V560" />
                    </g>
                    <g className={styles.moduleBack + " studies-moduleBack"}>
                        <Cube x={340} y={179} size={64} />
                    </g>
                    <g className={styles.moduleLeft + " studies-moduleLeft"}>
                        <Cube x={224} y={250} size={67} />
                    </g>
                    <g className={styles.moduleRight + " studies-moduleRight"}>
                        <Cube x={456} y={250} size={67} />
                    </g>
                    <Cube x={340} y={289} size={58} accent />
                    <g className={styles.moduleFront + " studies-moduleFront"}>
                        <Cube x={340} y={334} size={72} />
                    </g>
                    <g
                        className={styles.glassTop + " studies-glassTop"}
                        stroke="var(--diagram-highlight, #ecdbcf)"
                        strokeOpacity=".65"
                        strokeWidth="1.3"
                        fill={`url(#${id}-glass)`}
                    >
                        <path d="M340 90 534 185 340 280 146 185Z" />
                        <path d="M146 185 v5 L340 285 534 190 v-5 M340 280 v5" opacity=".4" />
                        <path
                            d="M177 185 255 147 M425 147 503 185"
                            stroke="#ff7145"
                            strokeWidth="5"
                        />
                        <path
                            d="M177 188 255 150 M425 150 503 188"
                            stroke="#ffb495"
                            strokeWidth="1"
                        />
                    </g>
                    <g
                        className={styles.glassLeft + " studies-glassLeft"}
                        stroke="var(--diagram-highlight, #ecdbcf)"
                        strokeOpacity=".6"
                        strokeWidth="1.3"
                        fill={`url(#${id}-glass)`}
                    >
                        <path d="M135 313 324 405 V600 L135 508Z" />
                        <path
                            d="M151 340 V491 L306 567"
                            stroke="var(--diagram-highlight, #ffe7d8)"
                            opacity=".15"
                        />
                        <path d="M150 438 v58 l62 30" stroke="#ff7145" strokeWidth="5" />
                        <path d="M146 330 294 403" opacity=".6" />
                    </g>
                    <g
                        className={styles.glassRight + " studies-glassRight"}
                        stroke="var(--diagram-highlight, #ecdbcf)"
                        strokeOpacity=".6"
                        strokeWidth="1.3"
                        fill={`url(#${id}-glass)`}
                    >
                        <path d="M356 405 545 313 V508 L356 600Z" />
                        <path
                            d="M372 422 529 346 V491 L373 567"
                            stroke="var(--diagram-highlight, #ffe7d8)"
                            opacity=".15"
                        />
                        <path d="M529 438 v58 l-62 30" stroke="#ff7145" strokeWidth="5" />
                        <path d="M383 405 537 330" opacity=".6" />
                    </g>
                    <g
                        className={styles.cubeLabels + " studies-cubeLabels"}
                        fill="var(--diagram-highlight, #edc8b2)"
                        fontSize="20"
                        fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
                    >
                        <path
                            d="M340 158 V72 M148 298 H45 M532 298 H635 M340 487 V608"
                            fill="none"
                            stroke="#ac765a"
                            strokeWidth="1"
                        />
                        <text x="340" y="55" textAnchor="middle">
                            Layout
                        </text>
                        <text x="40" y="281">
                            Style
                        </text>
                        <text x="640" y="281" textAnchor="end">
                            Content
                        </text>
                        <text x="340" y="636" textAnchor="middle">
                            Interactions
                        </text>
                    </g>
                    <text
                        className={styles.assembledLabel + " studies-assembledLabel opacity-0"}
                        x="340"
                        y="636"
                        textAnchor="middle"
                        fill="var(--diagram-highlight, #edc8b2)"
                        fontSize="22"
                    >
                        Your app
                    </text>
                </svg>
            </div>
            <div className="studies-assemblyCopy min-w-0 max-md:p-0 max-md:[&_.studies-intro]:max-w-full">
                <Layers3
                    size={28}
                    strokeWidth={1.3}
                    className="studies-accentIcon text-[var(--study-accent)] mb-5.5 max-md:mt-0 max-md:mx-0 max-md:mb-4"
                    aria-hidden="true"
                />
                <h2 id={`${id}-heading`}>
                    Every piece. <em>Yours to keep.</em>
                </h2>
                <p className="studies-intro text-[var(--study-muted)] text-[15px] leading-[1.65] max-w-87.5 my-4.5 mx-0 text-pretty max-md:text-[14px]">
                    Read the source, download the project, and keep building outside the
                    conversation.
                </p>
                <p className="studies-ownershipNote max-w-87.5 text-[13px] leading-[1.6] text-[var(--study-muted)]">
                    Inspect individual files or download the complete project ZIP from your
                    workspace.
                </p>
            </div>
        </section>
    );
}
