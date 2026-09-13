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
  return <div className={styles.miniSite}>
    <div className={`${styles.previewPart} ${styles.miniNav}`}><strong>Clover.</strong><span>A life in the pasture</span></div>
    <div className={styles.miniBody}>
      <div className={`${styles.previewPart} ${styles.miniCopy}`}>
        <h3>Good grass.<br />Great company.</h3>
        <p>Meet Clover. Meadow enthusiast.<br />Your new favourite neighbour.</p>
        <button type="button" className={styles.miniContact} onClick={() => setGreeted(!greeted)} aria-pressed={greeted}>
          {greeted ? "Say hello again" : "Say hello"}<ArrowRight size={12} aria-hidden="true" />
        </button>
        <p className={styles.miniGreeting} role="status">{greeted ? "Moo! Thanks for stopping by." : "A little portfolio. A lot of personality."}</p>
      </div>
      <Image className={`${styles.previewPart} ${styles.cowPhoto}`} src="/landing/cow-portrait.jpg" alt="Clover, a brown and white cow looking at the camera" width={480} height={560} sizes="(max-width: 640px) 45vw, 240px" />
    </div>
  </div>;
}

export function FilterStudy() {
  const [demo, setDemo] = useState({ iteration: 0, animate: false });
  const started = demo.iteration > 0;
  const id = useId();
  return <section id="filter" className={`${styles.section} ${styles.filter}`} aria-labelledby={`${id}-heading`}>
    <div key={demo.iteration} className={styles.filterVisual} data-started={started} data-animate={demo.animate}>
      <svg viewBox="0 0 720 430" className={styles.filterSvg} role="img" aria-label="Loose ideas for a cow portfolio pass through an orange sieve and become a small app preview below">
        <defs>
          <linearGradient id={`${id}-bowl`} x1="0" y1="0" x2=".4" y2="1"><stop stopColor="#ff9565"/><stop offset=".42" stopColor="#f36732"/><stop offset="1" stopColor="#9f3017"/></linearGradient>
          <linearGradient id={`${id}-rim`}><stop stopColor="#ffb68b"/><stop offset=".45" stopColor="#ff7d42"/><stop offset="1" stopColor="#c1421a"/></linearGradient>
          <radialGradient id={`${id}-wash`}><stop stopColor="#ff6129" stopOpacity=".22"/><stop offset="1" stopColor="#ff6129" stopOpacity="0"/></radialGradient>
          <clipPath id={`${id}-bowlClip`}><path d="M153 205 Q173 379 355 386 Q527 379 556 205Z"/></clipPath>
          <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="8" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".1"/></feComponentTransfer><feComposite in2="SourceAlpha" operator="in"/><feBlend in="SourceGraphic" mode="soft-light"/></filter>
        </defs>
        <ellipse cx="359" cy="305" rx="310" ry="285" fill={`url(#${id}-wash)`}/>
        <g fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize="30" fill="var(--study-accent, #ffbd98)" textAnchor="middle">
          {ideas.map((idea, index) => <g key={idea.text} className={styles.ideaPhrase} style={{ "--delay": `${index * 90}ms` } as CSSProperties}>
            <text x={idea.x} y={idea.y} transform={`rotate(${idea.rotate} ${idea.x} ${idea.y})`}>{idea.text}</text>
          </g>)}
        </g>
        <g filter={`url(#${id}-grain)`}>
          <path d="M528 205 696 151 704 168 537 225Z" fill="#db5226"/>
          <path d="M544 204 696 155" stroke="#ffbd90" strokeWidth="2" opacity=".6"/>
          <path d="M153 205 Q173 379 355 386 Q527 379 556 205Z" fill={`url(#${id}-bowl)`}/>
          <g clipPath={`url(#${id}-bowlClip)`} fill="#6b2514">
            {Array.from({length:5},(_,row)=>Array.from({length:11},(_,col)=><ellipse key={`${row}-${col}`} cx={167+col*38+(row%2)*18} cy={253+row*29 + Math.sin(col/10*Math.PI)*row*3} rx={4.5-row*.35} ry={6-row*.6} transform={`rotate(${(col-5)*-5} ${167+col*38+(row%2)*18} ${253+row*29})`}/>))}
          </g>
          <ellipse cx="355" cy="205" rx="205" ry="17" fill="#a33e20"/>
          <ellipse cx="355" cy="200" rx="205" ry="13" fill={`url(#${id}-rim)`}/>
          <path d="M165 198 Q355 177 546 198" stroke="#ffd4af" fill="none" strokeWidth="2" opacity=".7"/>
        </g>
        <path d="M355 395 V425 M347 417 355 425 363 417" fill="none" stroke="#ff9f73" strokeWidth="2" opacity=".7" />
      </svg>
      <div className={styles.previewSlot}>
        {started ? <CowPreview /> : <div className={styles.previewPlaceholder}>Your app takes shape here.</div>}
      </div>
    </div>
    <div className={styles.filterCopy}>
      <p className={styles.filterLead}>Ideas can start messy.</p>
      <h2 id={`${id}-heading`}>Your words. A working <em>starting point.</em></h2>
      <p className={styles.intro}>“A portfolio for my cow. Big photos. Make it orange.” Start there. Shape the rest as you go.</p>
      <button type="button" className={styles.action} onClick={(event) => setDemo(previous => ({ iteration: previous.iteration + 1, animate: event.detail !== 0 }))}>
        {started ? "Replay" : "See the transformation"}
        {started ? <RotateCcw size={17} aria-hidden="true"/> : <ArrowRight size={18} aria-hidden="true"/>}
      </button>
      <p className={styles.caption} aria-live="polite">{started ? "Example portfolio revealed. Try its Say hello button." : "Watch a sample idea become a tiny portfolio."} Interactive sample. No generation credits used.</p>
    </div>
  </section>;
}
