"use client";

import { useEffect, useRef } from "react";

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const details = useRef<HTMLDetailsElement>(null);
  const content = useRef<HTMLParagraphElement>(null);
  const fade = useRef<Animation | null>(null);

  useEffect(() => () => fade.current?.cancel(), []);

  return <details ref={details}>
    <summary onClick={event => {
      fade.current?.cancel();
      // Native details owns expansion; only pointer-initiated openings fade.
      if (event.detail === 0 || details.current?.open || !content.current?.animate) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const easing = getComputedStyle(content.current).getPropertyValue("--ease-out").trim();
      fade.current = content.current.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: reduced ? 80 : 140,
        easing: easing || "cubic-bezier(0.23, 1, 0.32, 1)",
      });
    }}>
      {question}<span aria-hidden="true">+</span>
    </summary>
    <p ref={content}>{answer}</p>
  </details>;
}
