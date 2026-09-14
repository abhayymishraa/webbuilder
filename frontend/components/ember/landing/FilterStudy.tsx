"use client";

import { useId, useState, type CSSProperties } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import Image from "next/image";
import styles from "./studies.module.css";

const ideas = [
  { text: "cow portfolio", x: 295, y: 56, rotate: -7 },
  { text: "big photos", x: 465, y: 112, rotate: 9 },
  { text: "orange", x: 215, y: 145, rotate: -10 },
  { text: "contact me", x: 372, y: 180, rotate: 5 },
];

function CowPreview() {
  const [greeted, setGreeted] = useState(false);
  return (
    <div
      className={
        styles.miniSite +
        " studies-miniSite min-h-65 bg-[var(--mini-surface,_#17100d)] border border-[var(--study-border,_#79503a)] rounded-[9px] overflow-hidden [box-shadow:0_12px_30px_#0004]"
      }
    >
      <div
        className={`${styles.previewPart} studies-previewPart ${styles.miniNav} studies-miniNav flex justify-between items-center py-2.5 px-3.5 border-b border-b-[var(--study-border,_#432c20)] text-[10px] text-[var(--study-muted)] [&_strong]:text-[14px] [&_strong]:tracking-[-.04em] [&_strong]:text-[var(--study-accent)]`}
      >
        <strong>Clover.</strong>
        <span>A life in the pasture</span>
      </div>
      <div className="studies-miniBody grid grid-cols-[1.25fr_1fr] gap-3 p-3.5 max-md:gap-2.5 max-md:p-3">
        <div
          className={`${styles.previewPart} studies-previewPart ${styles.miniCopy} studies-miniCopy [&_h3]:text-[22px] [&_h3]:leading-[1.1] [&_h3]:tracking-[-.045em] [&_h3]:font-medium [&_h3]:mt-0 [&_h3]:mx-0 [&_h3]:mb-[9px] [&_h3]:text-[var(--study-text)] [&_p]:text-[10px] [&_p]:leading-[1.5] [&_p]:text-[var(--study-muted)] [&_p]:mt-0 [&_p]:mx-0 [&_p]:mb-2.5 [&_.studies-miniGreeting]:mt-2 [&_.studies-miniGreeting]:mx-0 [&_.studies-miniGreeting]:mb-0 [&_.studies-miniGreeting]:min-h-7.5 [&_.studies-miniGreeting]:text-[9px] max-md:[&_h3]:text-[20px]`}
        >
          <h3>
            Good grass.
            <br />
            Great company.
          </h3>
          <p>
            Meet Clover. Meadow enthusiast.
            <br />
            Your new favourite neighbour.
          </p>
          <button
            type="button"
            className="studies-miniContact bg-[#ff8952] text-[#281108] border-0 rounded-[4px] inline-flex items-center gap-3 min-h-11 py-2 px-[11px] text-[11px]! [&:hover]:bg-[#ffac81]"
            onClick={() => setGreeted(!greeted)}
            aria-pressed={greeted}
          >
            {greeted ? "Say hello again" : "Say hello"}
            <ArrowRight size={12} aria-hidden="true" />
          </button>
          <p className={styles.miniGreeting} role="status">
            {greeted
              ? "Moo! Thanks for stopping by."
              : "A little portfolio. A lot of personality."}
          </p>
        </div>
        <Image
          className={`${styles.previewPart} studies-previewPart ${styles.cowPhoto} studies-cowPhoto block w-full h-[165px] [object-fit:cover] rounded-[5px] max-md:h-[165px]`}
          src="/landing/cow-portrait.jpg"
          alt="Clover, a brown and white cow looking at the camera"
          width={480}
          height={560}
          sizes="(max-width: 640px) 45vw, 240px"
        />
      </div>
    </div>
  );
}

export function FilterStudy() {
  const [demo, setDemo] = useState({ iteration: 0, animate: false });
  const started = demo.iteration > 0;
  const id = useId();
  return (
    <section
      id="filter"
      className={`studies-section relative max-w-270 m-auto scroll-mt-6 [&_h1]:text-[clamp(32px,_3.5vw,_44px)] [&_h1]:font-normal [&_h1]:leading-[1.1] [&_h1]:tracking-[-.045em] [&_h1]:m-0 [&_h1]:text-balance [&_h2]:text-[clamp(32px,_3.5vw,_44px)] [&_h2]:font-normal [&_h2]:leading-[1.1] [&_h2]:tracking-[-.045em] [&_h2]:m-0 [&_h2]:text-balance [&_em]:[font-family:"Iowan_Old_Style",_"Palatino_Linotype",_"Book_Antiqua",_Georgia,_serif] [&_em]:font-normal [&_em]:tracking-[-.045em] [&_em]:leading-[1.17] max-md:[&_h1]:text-[clamp(30px,_7.5vw,_38px)] max-md:[&_h2]:text-[clamp(30px,_7.5vw,_38px)] ${styles.filter} studies-filter max-md:grid-cols-[1fr] max-md:py-7.5 max-md:px-6 max-md:min-h-auto max-md:gap-6`}
      aria-labelledby={`${id}-heading`}
    >
      <div
        key={demo.iteration}
        className={
          styles.filterVisual +
          " studies-filterVisual w-[min(400px,_100%)] m-auto [&[data-started=true]_.studies-ideaPhrase]:opacity-35 max-md:w-[min(100%,_340px)] max-md:m-auto"
        }
        data-started={started}
        data-animate={demo.animate}
      >
        <svg
          viewBox="0 0 720 430"
          className="studies-filterSvg w-full block"
          role="img"
          aria-label="Loose ideas for a cow portfolio pass through an orange sieve and become a small app preview below"
        >
          <defs>
            <linearGradient id={`${id}-bowl`} x1="0" y1="0" x2=".4" y2="1">
              <stop stopColor="#ff9565" />
              <stop offset=".42" stopColor="#f36732" />
              <stop offset="1" stopColor="#9f3017" />
            </linearGradient>
            <linearGradient id={`${id}-rim`}>
              <stop stopColor="#ffb68b" />
              <stop offset=".45" stopColor="#ff7d42" />
              <stop offset="1" stopColor="#c1421a" />
            </linearGradient>
            <radialGradient id={`${id}-wash`}>
              <stop stopColor="#ff6129" stopOpacity=".22" />
              <stop offset="1" stopColor="#ff6129" stopOpacity="0" />
            </radialGradient>
            <clipPath id={`${id}-bowlClip`}>
              <path d="M153 205 Q173 379 355 386 Q527 379 556 205Z" />
            </clipPath>
            <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency=".8"
                numOctaves="3"
                seed="8"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="linear" slope=".1" />
              </feComponentTransfer>
              <feComposite in2="SourceAlpha" operator="in" />
              <feBlend in="SourceGraphic" mode="soft-light" />
            </filter>
          </defs>
          <ellipse
            cx="359"
            cy="305"
            rx="310"
            ry="285"
            fill={`url(#${id}-wash)`}
          />
          <g
            fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
            fontSize="30"
            fill="var(--study-accent, #ffbd98)"
            textAnchor="middle"
          >
            {ideas.map((idea, index) => (
              <g
                key={idea.text}
                className={styles.ideaPhrase + " studies-ideaPhrase"}
                style={{ "--delay": `${index * 90}ms` } as CSSProperties}
              >
                <text
                  x={idea.x}
                  y={idea.y}
                  transform={`rotate(${idea.rotate} ${idea.x} ${idea.y})`}
                >
                  {idea.text}
                </text>
              </g>
            ))}
          </g>
          <g filter={`url(#${id}-grain)`}>
            <path d="M528 205 696 151 704 168 537 225Z" fill="#db5226" />
            <path
              d="M544 204 696 155"
              stroke="#ffbd90"
              strokeWidth="2"
              opacity=".6"
            />
            <path
              d="M153 205 Q173 379 355 386 Q527 379 556 205Z"
              fill={`url(#${id}-bowl)`}
            />
            <g clipPath={`url(#${id}-bowlClip)`} fill="#6b2514">
              {Array.from({ length: 5 }, (_, row) =>
                Array.from({ length: 11 }, (_, col) => (
                  <ellipse
                    key={`${row}-${col}`}
                    cx={167 + col * 38 + (row % 2) * 18}
                    cy={
                      253 + row * 29 + Math.sin((col / 10) * Math.PI) * row * 3
                    }
                    rx={4.5 - row * 0.35}
                    ry={6 - row * 0.6}
                    transform={`rotate(${(col - 5) * -5} ${167 + col * 38 + (row % 2) * 18} ${253 + row * 29})`}
                  />
                )),
              )}
            </g>
            <ellipse cx="355" cy="205" rx="205" ry="17" fill="#a33e20" />
            <ellipse
              cx="355"
              cy="200"
              rx="205"
              ry="13"
              fill={`url(#${id}-rim)`}
            />
            <path
              d="M165 198 Q355 177 546 198"
              stroke="#ffd4af"
              fill="none"
              strokeWidth="2"
              opacity=".7"
            />
          </g>
          <path
            d="M355 395 V425 M347 417 355 425 363 417"
            fill="none"
            stroke="#ff9f73"
            strokeWidth="2"
            opacity=".7"
          />
        </svg>
        <div className="studies-previewSlot min-h-65 w-[min(100%,_380px)] my-0 mx-auto">
          {started ? (
            <CowPreview />
          ) : (
            <div className="studies-previewPlaceholder h-65 grid place-items-center border border-dashed border-[var(--study-border,_#594032)] rounded-[9px] text-[var(--study-muted)] text-[12px]">
              Your app takes shape here.
            </div>
          )}
        </div>
      </div>
      <div className="studies-filterCopy relative min-w-0">
        <p className="studies-filterLead text-[var(--study-muted)] text-[13px] mt-0 mx-0 mb-4">
          Ideas can start messy.
        </p>
        <h2 id={`${id}-heading`}>
          Your words. A working <em>starting point.</em>
        </h2>
        <p className="studies-intro text-[var(--study-muted)] text-[15px] leading-[1.65] max-w-87.5 my-4.5 mx-0 text-pretty max-md:text-[14px]">
          “A portfolio for my cow. Big photos. Make it orange.” Start there.
          Shape the rest as you go.
        </p>
        <button
          type="button"
          className={styles.action + " studies-action [&:hover]:bg-[#ff946f]"}
          onClick={(event) =>
            setDemo((previous) => ({
              iteration: previous.iteration + 1,
              animate: event.detail !== 0,
            }))
          }
        >
          {started ? "Replay" : "See the transformation"}
          {started ? (
            <RotateCcw size={17} aria-hidden="true" />
          ) : (
            <ArrowRight size={18} aria-hidden="true" />
          )}
        </button>
        <p
          className="studies-caption text-[var(--study-muted)] text-[12px] leading-[1.6] mt-5 min-h-10 max-w-87.5"
          aria-live="polite"
        >
          {started
            ? "Example portfolio revealed. Try its Say hello button."
            : "Watch a sample idea become a tiny portfolio."}{" "}
          Interactive sample. No generation credits used.
        </p>
      </div>
    </section>
  );
}
