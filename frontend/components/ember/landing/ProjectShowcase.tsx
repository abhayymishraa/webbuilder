"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { starterBriefs } from "@/lib/starter-briefs";
import styles from "./project-showcase.module.css";

const concepts = [
  { brief: starterBriefs[0], description: "A quiet place to collect books, find your next read, and keep track of the ones you finish.", features: ["Book collection", "Search", "Reading status"] },
  { brief: starterBriefs[1], description: "A simple daily checklist that makes your habits easy to see and small wins easy to keep.", features: ["Editable habits", "Daily checklist", "Clear progress"] },
  { brief: starterBriefs[2], description: "A considered home for your work, with space for the story behind each project and a way to get in touch.", features: ["Project gallery", "Project details", "Contact form"] },
];

function ExamplePreview({ kind }: { kind: typeof starterBriefs[number]["id"] }) {
  return <div className={styles.preview} aria-hidden="true">
    <div className={styles.previewNav}><span>{kind === "reading" ? "the reading room" : kind === "habits" ? "a little, daily" : "studio / work"}</span><span>•••</span></div>
    {kind === "reading" ? <div className={styles.reading}>
      <p>MAKE TIME FOR A GOOD BOOK</p>
      <h4>Stay curious.</h4>
      <div className={styles.books}>
        <div><span>THE ART OF</span><strong>Noticing</strong><small>ESSAYS / 01</small></div>
        <div><span>FIELD NOTES</span><strong>Outside</strong><small>COLLECTION / 02</small></div>
        <div><span>A SLOWER</span><strong>Sunday</strong><small>STORIES / 03</small></div>
      </div>
      <div className={styles.previewFoot}><span>Your shelf, your pace.</span><span>All books ↗</span></div>
    </div> : kind === "habits" ? <div className={styles.habits}>
      <p>A FRESH START</p><h4>Keep showing up.</h4>
      {["Read a few pages", "Take a walk", "Make something"].map((habit, index) => <div className={styles.habit} key={habit}>
        <span className={index < 2 ? styles.checked : styles.unchecked}>{index < 2 && <Check size={13} />}</span><span>{habit}</span><small>DAILY</small>
      </div>)}
      <div className={styles.previewFoot}><span>One day at a time.</span></div>
    </div> : <div className={styles.portfolio}>
      <p>INDEPENDENT DESIGNER</p><h4>Work with a point of view.</h4>
      <div className={styles.work}><div><span>FORM / 01</span><i /></div><div><span>SPACE / 02</span><i /></div></div>
      <div className={styles.previewFoot}><span>Selected projects</span><span>Let’s talk ↗</span></div>
    </div>}
  </div>;
}

export function ProjectShowcase() {
  const [{ active, animate }, setSelection] = useState({ active: 0, animate: false });
  const concept = concepts[active];
  const move = (direction: number, animate = false) => setSelection(current => ({ active: (current.active + direction + concepts.length) % concepts.length, animate }));

  return <section id="filter" className={styles.section} aria-labelledby="showcase-heading" aria-roledescription="carousel">
    <header className={styles.heading}>
      <p>STARTER CONCEPTS</p>
      <h2 id="showcase-heading">A glimpse of what’s possible.</h2>
    </header>
    <div className={styles.carousel} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }
    }} tabIndex={0} role="group" aria-label="App concepts. Use left and right arrow keys to browse.">
      <button className={`${styles.arrow} ${styles.previous}`} type="button" aria-label="Previous concept" onClick={event => move(-1, event.detail > 0)}><span className={styles.arrowFace}><ArrowLeft size={17} aria-hidden="true" /></span></button>
      <div className={styles.slideStack} data-animate={animate}>
      {concepts.map((item, index) => <article key={item.brief.id} className={styles.card} data-active={index === active} inert={index !== active} aria-hidden={index !== active} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${concepts.length}: ${item.brief.title}`}>
        <ExamplePreview kind={item.brief.id} />
        <div className={styles.copy}>
          <p className={styles.category}>{item.brief.category}</p>
          <h3>{item.brief.title}</h3>
          <p className={styles.description}>{item.description}</p>
          <Link href={`/chat?starter=${item.brief.id}`} className={styles.link}>Use this brief <ArrowUpRight size={16} aria-hidden="true" /></Link>
          <ul className={styles.features}>{item.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
        </div>
      </article>)}
      </div>
      <button className={`${styles.arrow} ${styles.next}`} type="button" aria-label="Next concept" onClick={event => move(1, event.detail > 0)}><span className={styles.arrowFace}><ArrowRight size={17} aria-hidden="true" /></span></button>
    </div>
    <div className={styles.pagination}>
      <div className={styles.indicators} aria-hidden="true">{concepts.map((item, index) => <span key={item.brief.id} data-active={index === active} />)}</div>
      <p role="status" aria-live="polite" aria-atomic="true">{String(active + 1).padStart(2, "0")} / 03 {concept.brief.title}</p>
    </div>
    <p className={styles.note}>Illustrative layouts. Choose a brief to start your own version.</p>
  </section>;
}
