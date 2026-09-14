"use client";

// Adapted from React Bits TiltedCard. See REACT-BITS-LICENSE.
// https://github.com/DavidHDev/react-bits/blob/3a1c7f2f9f94ed833934ab5c2635760b9e644583/src/ts-tailwind/Components/TiltedCard/TiltedCard.tsx
import { motion, useSpring } from "motion/react";
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

const spring = { damping: 30, stiffness: 100, mass: 2 };

export function TiltedPreview({ active, children }: { active: boolean; children: ReactNode }) {
    const enabled = useRef(false);
    const rotateX = useSpring(0, spring);
    const rotateY = useSpring(0, spring);

    useEffect(() => {
        const media = window.matchMedia(
            "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        );
        const sync = () => {
            enabled.current = active && media.matches;
            rotateX.jump(0);
            rotateY.jump(0);
        };
        sync();
        media.addEventListener("change", sync);
        return () => media.removeEventListener("change", sync);
    }, [active, rotateX, rotateY]);

    function tilt(event: PointerEvent<HTMLDivElement>) {
        if (!enabled.current || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
        rotateX.set(-Math.max(-1, Math.min(1, y)) * 3);
        rotateY.set(Math.max(-1, Math.min(1, x)) * 3);
    }

    function reset() {
        rotateX.set(0);
        rotateY.set(0);
    }

    return (
        <div
            className="flex min-w-0 [perspective:800px]"
            onPointerMove={tilt}
            onPointerLeave={reset}
            onPointerCancel={reset}
        >
            <motion.div
                className="flex min-w-0 flex-1 [&>*]:flex-1 motion-reduce:transform-none! [@media(pointer:coarse)]:transform-none! [@media(hover:none)]:transform-none!"
                style={{ rotateX, rotateY }}
            >
                {children}
            </motion.div>
        </div>
    );
}
