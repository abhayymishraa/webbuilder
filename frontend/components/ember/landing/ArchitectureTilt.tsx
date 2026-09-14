"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useSpring,
} from "motion/react";

const spring = { mass: 1, stiffness: 100, damping: 10 };
const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

export function ArchitectureTilt({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const interactive = enabled && reduced === false;
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    pitch: number;
    yaw: number;
    width: number;
    height: number;
  } | null>(null);
  const pitch = useSpring(0, spring);
  const yaw = useSpring(0, spring);
  const transform = useMotionTemplate`perspective(900px) rotateX(${pitch}deg) rotateY(${yaw}deg)`;

  const releasePointer = useCallback(() => {
    const pointer = drag.current?.pointer;
    drag.current = null;
    if (stage.current) {
      delete stage.current.dataset.dragging;
      if (pointer !== undefined && stage.current.hasPointerCapture(pointer))
        stage.current.releasePointerCapture(pointer);
    }
  }, []);

  useEffect(() => {
    if (!interactive) {
      releasePointer();
      pitch.jump(0);
      yaw.jump(0);
    }
    return () => {
      pitch.stop();
      yaw.stop();
    };
  }, [interactive, pitch, yaw, releasePointer]);

  return (
    <div
      ref={stage}
      className="studies-archVisual w-[min(100%,_280px)] min-w-0 [justify-self:center] [&:focus-visible]:outline-2 [&:focus-visible]:outline-solid [&:focus-visible]:outline-[var(--study-focus,_#ffb797)] [&:focus-visible]:outline-offset-2 [&:focus-visible]:rounded-[12px] [@media(prefers-reduced-motion:_no-preference)_and_(hover:_hover)_and_(pointer:_fine)]:[&[data-interactive=true]]:cursor-grab [@media(prefers-reduced-motion:_no-preference)_and_(hover:_hover)_and_(pointer:_fine)]:[&[data-interactive=true]]:select-none [@media(prefers-reduced-motion:_no-preference)_and_(hover:_hover)_and_(pointer:_fine)]:[&[data-dragging=true]]:cursor-grabbing max-md:w-[min(100%,_220px)]"
      data-interactive={interactive}
      tabIndex={interactive ? 0 : undefined}
      role="group"
      aria-label={
        interactive
          ? "Rotate architecture diagram. Drag with your mouse, or use arrow keys. Escape resets the view."
          : "Architecture diagram"
      }
      onPointerDown={(event) => {
        if (
          !interactive ||
          event.pointerType !== "mouse" ||
          event.button !== 0 ||
          drag.current
        )
          return;
        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        drag.current = {
          pointer: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          pitch: pitch.get(),
          yaw: yaw.get(),
          width: Math.max(bounds.width, 1),
          height: Math.max(bounds.height, 1),
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.dataset.dragging = "true";
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!start || event.pointerId !== start.pointer) return;
        pitch.set(
          clamp(
            start.pitch - ((event.clientY - start.y) / start.height) * 32,
            16,
          ),
        );
        yaw.set(
          clamp(start.yaw + ((event.clientX - start.x) / start.width) * 48, 24),
        );
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointer !== event.pointerId) return;
        releasePointer();
        // A spring retarget preserves its velocity, carrying the release momentum.
        pitch.set(0);
        yaw.set(0);
      }}
      onPointerCancel={(event) => {
        if (drag.current?.pointer !== event.pointerId) return;
        releasePointer();
        pitch.jump(0);
        yaw.jump(0);
      }}
      onLostPointerCapture={(event) => {
        if (drag.current?.pointer !== event.pointerId) return;
        releasePointer();
        pitch.set(0);
        yaw.set(0);
      }}
      onBlur={() => {
        releasePointer();
        pitch.jump(0);
        yaw.jump(0);
      }}
      onKeyDown={(event) => {
        if (!interactive || event.target !== event.currentTarget) return;
        if (
          ![
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Escape",
          ].includes(event.key)
        )
          return;
        event.preventDefault();
        releasePointer();
        // Keyboard inspection is immediate; only pointer gestures use spring motion.
        pitch.jump(pitch.get());
        yaw.jump(yaw.get());
        if (event.key === "Escape") {
          pitch.jump(0);
          yaw.jump(0);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight")
          yaw.jump(clamp(yaw.get() + (event.key === "ArrowLeft" ? -6 : 6), 24));
        else
          pitch.jump(
            clamp(pitch.get() + (event.key === "ArrowUp" ? 6 : -6), 16),
          );
      }}
    >
      <motion.div style={{ transform: reduced ? "none" : transform }}>
        {children}
      </motion.div>
    </div>
  );
}
