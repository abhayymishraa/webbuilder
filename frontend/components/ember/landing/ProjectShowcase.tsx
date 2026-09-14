"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { starterBriefs } from "@/lib/starter-briefs";
import { TiltedPreview } from "./TiltedPreview";
import styles from "./project-showcase.module.css";

const concepts = [
  {
    brief: starterBriefs[0],
    description:
      "A quiet place to collect books, find your next read, and keep track of the ones you finish.",
    features: ["Book collection", "Search", "Reading status"],
  },
  {
    brief: starterBriefs[1],
    description:
      "A simple daily checklist that makes your habits easy to see and small wins easy to keep.",
    features: ["Editable habits", "Daily checklist", "Clear progress"],
  },
  {
    brief: starterBriefs[2],
    description:
      "A considered home for your work, with space for the story behind each project and a way to get in touch.",
    features: ["Project gallery", "Project details", "Contact form"],
  },
];

function ExamplePreview({
  kind,
}: {
  kind: (typeof starterBriefs)[number]["id"];
}) {
  return (
    <div
      className="showcase-preview min-w-0 [container-type:inline-size] m-2.5 p-[clamp(12px,_2vw,_20px)] border border-[#49372e] rounded-[18px] bg-[#1a1411] text-[#f7e9dd] font-sans wrap-anywhere [&_p]:mt-0 [&_p]:mx-0 [&_p]:mb-2 [&_p]:text-[#c4b0a2] [&_p]:text-[8px] [&_p]:tracking-[.12em] [&_h4]:text-[26px] [&_h4]:leading-[1.15] [&_h4]:tracking-[-.04em] [&_h4]:mt-0 [&_h4]:mx-0 [&_h4]:mb-5.5 [&_h4]:font-medium max-[961px]:p-[clamp(12px,_4vw,_24px)]"
      aria-hidden="true"
    >
      <div className="showcase-previewNav flex items-center justify-between gap-3 text-[10px] text-[#c4b0a2]">
        <span>
          {kind === "reading"
            ? "the reading room"
            : kind === "habits"
              ? "a little, daily"
              : "studio / work"}
        </span>
        <span>•••</span>
      </div>
      {kind === "reading" ? (
        <div className="showcase-reading pt-7">
          <p>MAKE TIME FOR A GOOD BOOK</p>
          <h4>Stay curious.</h4>
          <div
            className={
              styles.books +
              " showcase-books grid grid-cols-3 gap-[clamp(5px,_2cqi,_10px)] [&>div:nth-child(2)]:bg-[#ff8855] [&>div:nth-child(3)]:bg-[#ddd1ba] [&_span]:text-[6px] [&_span]:tracking-[.08em] [&_small]:text-[6px] [&_small]:tracking-[.08em] [&_strong]:text-[clamp(12px,_5cqi,_19px)] [&_strong]:font-medium [&_strong]:pt-2 [&_strong]:tracking-[-.04em] [&_small]:mt-auto"
            }
          >
            <div>
              <span>THE ART OF</span>
              <strong>Noticing</strong>
              <small>ESSAYS / 01</small>
            </div>
            <div>
              <span>FIELD NOTES</span>
              <strong>Outside</strong>
              <small>COLLECTION / 02</small>
            </div>
            <div>
              <span>A SLOWER</span>
              <strong>Sunday</strong>
              <small>STORIES / 03</small>
            </div>
          </div>
          <div className="showcase-previewFoot flex justify-between gap-3 pt-5.5 text-[9px] text-[#c4b0a2]">
            <span>Your shelf, your pace.</span>
            <span>All books ↗</span>
          </div>
        </div>
      ) : kind === "habits" ? (
        <div className="showcase-habits pt-7">
          <p>A FRESH START</p>
          <h4>Keep showing up.</h4>
          {["Read a few pages", "Take a walk", "Make something"].map(
            (habit, index) => (
              <div
                className="showcase-habit flex items-center gap-2.5 min-h-[39px] text-[12px] border-b border-b-[#49372e] [&_small]:ml-auto [&_small]:text-[#c4b0a2] [&_small]:text-[7px]"
                key={habit}
              >
                <span
                  className={
                    index < 2
                      ? "showcase-checked shrink-0 w-[19px] h-[19px] grid place-items-center border rounded-full text-[#1a1411] bg-[#ff996b] border-[#ff996b]"
                      : "showcase-unchecked shrink-0 w-[19px] h-[19px] grid place-items-center border border-[#8c7160] rounded-full"
                  }
                >
                  {index < 2 && <Check size={13} />}
                </span>
                <span>{habit}</span>
                <small>DAILY</small>
              </div>
            ),
          )}
          <div className="showcase-previewFoot flex justify-between gap-3 pt-5.5 text-[9px] text-[#c4b0a2]">
            <span>One day at a time.</span>
          </div>
        </div>
      ) : (
        <div className="showcase-portfolio pt-7">
          <p>INDEPENDENT DESIGNER</p>
          <h4>Work with a point of view.</h4>
          <div
            className={
              styles.work +
              " showcase-work grid grid-cols-[1fr_1fr] gap-2.5 [&>div]:relative [&>div]:h-[105px] [&>div]:overflow-hidden [&>div]:bg-[#cb774e] [&>div]:rounded-[4px] [&>div:nth-child(2)]:bg-[#e6d7bf] [&_span]:relative [&_span]:z-1 [&_span]:block [&_span]:p-2 [&_span]:text-[#24160e] [&_span]:text-[7px] [&_i]:absolute [&_i]:w-18 [&_i]:h-18 [&_i]:-bottom-3 [&_i]:right-3 [&_i]:border-12 [&_i]:border-[#562f1f] [&_i]:rounded-full"
            }
          >
            <div>
              <span>FORM / 01</span>
              <i />
            </div>
            <div>
              <span>SPACE / 02</span>
              <i />
            </div>
          </div>
          <div className="showcase-previewFoot flex justify-between gap-3 pt-5.5 text-[9px] text-[#c4b0a2]">
            <span>Selected projects</span>
            <span>Let’s talk ↗</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectShowcase() {
  const [{ active, animate }, setSelection] = useState({
    active: 0,
    animate: false,
  });
  const concept = concepts[active];
  const move = (direction: number, animate = false) =>
    setSelection((current) => ({
      active: (current.active + direction + concepts.length) % concepts.length,
      animate,
    }));

  return (
    <section
      id="filter"
      className="showcase-section py-12 px-0 scroll-mt-6 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-solid [&_a:focus-visible]:outline-ring [&_a:focus-visible]:outline-offset-1 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-solid [&_button:focus-visible]:outline-ring [&_button:focus-visible]:outline-offset-1 max-[961px]:py-10"
      aria-labelledby="showcase-heading"
      aria-roledescription="carousel"
    >
      <header className="showcase-heading text-center mb-7 [&>p]:mt-0 [&>p]:mx-0 [&>p]:mb-3 [&>p]:text-accent-foreground [&>p]:[font:11px/1.5_monospace] [&>p]:tracking-[.12em] [&_h2]:max-w-none [&_h2]:my-0 [&_h2]:mx-auto">
        <p>STARTER CONCEPTS</p>
        <h2 id="showcase-heading">A glimpse of what’s possible.</h2>
      </header>
      <div
        className={
          styles.carousel +
          " showcase-carousel relative py-3 px-14 rounded-[24px] [&:focus-visible]:outline-2 [&:focus-visible]:outline-solid [&:focus-visible]:outline-ring [&:focus-visible]:outline-offset-1 max-[961px]:pt-0 max-[961px]:px-0 max-[961px]:pb-15"
        }
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        tabIndex={0}
        role="group"
        aria-label="App concepts. Use left and right arrow keys to browse."
      >
        <button
          className={`${styles.arrow} showcase-arrow absolute z-2 top-[calc(50%_-_22px)] grid place-items-center w-11 h-11 p-0 border-0 rounded-full bg-transparent text-foreground cursor-pointer pointer-fine:[&:hover_.showcase-arrowFace]:bg-secondary max-[961px]:top-auto max-[961px]:bottom-0 showcase-previous left-0 max-[961px]:left-[calc(50%_-_52px)]`}
          type="button"
          aria-label="Previous concept"
          onClick={(event) => move(-1, event.detail > 0)}
        >
          <span className={styles.arrowFace + " showcase-arrowFace"}>
            <ArrowLeft size={17} aria-hidden="true" />
          </span>
        </button>
        <div
          className={
            styles.slideStack +
            " showcase-slideStack grid max-w-215 mx-auto min-w-0 [&_.showcase-card]:[grid-area:1_/_1] [&_.showcase-card]:w-full [&_.showcase-card]:min-w-0 [&_.showcase-card]:opacity-0 [&_.showcase-card]:pointer-events-none [&_.showcase-card[data-active=true]]:opacity-100 [&_.showcase-card[data-active=true]]:[pointer-events:auto] [&_.showcase-card[data-active=true]]:z-1 max-[961px]:max-w-150"
          }
          data-animate={animate}
        >
          {concepts.map((item, index) => (
            <article
              key={item.brief.id}
              className={
                styles.card +
                " showcase-card relative grid grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)] min-h-83 max-w-215 mx-auto bg-card border border-border rounded-[24px] max-[961px]:grid-cols-[minmax(0,_1fr)] max-[961px]:max-w-150"
              }
              data-active={index === active}
              inert={index !== active}
              aria-hidden={index !== active}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${concepts.length}: ${item.brief.title}`}
            >
              <TiltedPreview active={index === active}>
                <ExamplePreview kind={item.brief.id} />
              </TiltedPreview>
              <div className="showcase-copy min-w-0 flex items-start flex-col py-8 px-7 [&_h3]:mt-0 [&_h3]:mx-0 [&_h3]:mb-3 [&_h3]:text-[clamp(23px,_2.4vw,_30px)] [&_h3]:font-medium [&_h3]:leading-[1.15] [&_h3]:tracking-[-.04em] max-[961px]:p-[clamp(18px,_4vw,_28px)]">
                <p className="showcase-category mt-0 mx-0 mb-4 text-[12px] text-accent-foreground">
                  {item.brief.category}
                </p>
                <h3>{item.brief.title}</h3>
                <p className="showcase-description m-0 text-[14px] leading-[1.65] text-muted-foreground">
                  {item.description}
                </p>
                <Link
                  href={`/chat?starter=${item.brief.id}`}
                  className="showcase-link inline-flex items-center gap-2 min-h-11 mt-3 text-foreground text-[13px] underline underline-offset-[5px] pointer-fine:[&:hover]:text-accent-foreground"
                >
                  Use this brief <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <ul className="showcase-features flex flex-wrap gap-y-2 gap-x-4 list-none mt-auto mx-0 mb-0 pt-6 px-0 pb-0 text-muted-foreground text-[11px] leading-[1.5]">
                  {item.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <button
          className={`${styles.arrow} showcase-arrow absolute z-2 top-[calc(50%_-_22px)] grid place-items-center w-11 h-11 p-0 border-0 rounded-full bg-transparent text-foreground cursor-pointer pointer-fine:[&:hover_.showcase-arrowFace]:bg-secondary max-[961px]:top-auto max-[961px]:bottom-0 showcase-next right-0 max-[961px]:right-[calc(50%_-_52px)]`}
          type="button"
          aria-label="Next concept"
          onClick={(event) => move(1, event.detail > 0)}
        >
          <span className={styles.arrowFace + " showcase-arrowFace"}>
            <ArrowRight size={17} aria-hidden="true" />
          </span>
        </button>
      </div>
      <div className="showcase-pagination flex flex-col items-center gap-2 mt-4 [&_p]:m-0 [&_p]:text-[12px] [&_p]:leading-[1.6] [&_p]:text-muted-foreground max-[961px]:mt-3">
        <div
          className="showcase-indicators flex gap-[5px] [&_span]:w-[5px] [&_span]:h-[5px] [&_span]:rounded-[8px] [&_span]:bg-border [&_span[data-active=true]]:w-5 [&_span[data-active=true]]:bg-accent-foreground"
          aria-hidden="true"
        >
          {concepts.map((item, index) => (
            <span key={item.brief.id} data-active={index === active} />
          ))}
        </div>
        <p role="status" aria-live="polite" aria-atomic="true">
          {String(active + 1).padStart(2, "0")} / 03 {concept.brief.title}
        </p>
      </div>
      <p className="showcase-note m-0 text-[12px] leading-[1.6] text-muted-foreground mt-3 text-center">
        Illustrative layouts. Choose a brief to start your own version.
      </p>
    </section>
  );
}
