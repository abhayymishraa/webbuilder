"use client";

import { Brand } from "@/components/layout/Brand";
import { ThemeToggle } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import Link from "next/link";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import Console from "./Console";
import Ledger from "./Ledger";
import Passport from "./Passport";
import "./picker.css";
import type { Scenario } from "./ProfileParts";

const variants = [
    { name: "Passport", Component: Passport },
    { name: "Console", Component: Console },
    { name: "Ledger", Component: Ledger },
];

function selectedVariant() {
    const value = Number(new URLSearchParams(window.location.search).get("v"));
    return Number.isInteger(value) && value >= 1 && value <= variants.length ? value - 1 : 0;
}

function subscribeVariant(callback: () => void) {
    window.addEventListener("popstate", callback);
    return () => window.removeEventListener("popstate", callback);
}

export default function ProfilePrototype() {
    const current = useSyncExternalStore(subscribeVariant, selectedVariant, () => 0);
    const [revision, setRevision] = useState(0);
    const [scenario, setScenario] = useState<Scenario>("unlimited");
    const picker = useRef<HTMLElement>(null);
    const highlight = useRef<HTMLSpanElement>(null);
    const select = useCallback((index: number) => {
        setRevision((value) => value + 1);
        const url = new URL(window.location.href);
        url.searchParams.set("v", String(index + 1));
        window.history.replaceState(null, "", url);
        window.dispatchEvent(new PopStateEvent("popstate"));
        window.scrollTo({ top: 0, behavior: "instant" });
    }, []);

    useLayoutEffect(() => {
        const nav = picker.current;
        const marker = highlight.current;
        if (!nav || !marker) return;
        function measure() {
            const item = nav?.querySelector<HTMLElement>("[data-active]");
            if (!item || !marker) return;
            marker.style.width = `${item.offsetWidth}px`;
            marker.style.transform = `translateX(${item.offsetLeft}px)`;
        }
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(nav);
        let frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => {
                nav.dataset.ready = "";
            });
        });
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [current]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const target = event.target;
            if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
            if (
                target instanceof HTMLElement &&
                (target.closest(
                    "input, textarea, select, [contenteditable=true], [role=tablist]",
                ) ||
                    target.isContentEditable)
            )
                return;
            const number = Number(event.key);
            if (number >= 1 && number <= 3) {
                event.preventDefault();
                select(number - 1);
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                select((current + 1) % 3);
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                select((current + 2) % 3);
            } else if (event.key.toLowerCase() === "r") setRevision((value) => value + 1);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [current, select]);

    const Variant = variants[current].Component;
    return (
        <div className="min-h-[100dvh] bg-background text-foreground">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-card focus:p-4"
            >
                Skip to profile
            </a>
            <header className="flex h-19 items-center justify-between gap-4 border-b border-border px-5 md:px-10">
                <Brand />
                <nav aria-label="Workspace" className="flex items-center gap-5 text-sm">
                    <Link
                        href="/projects"
                        prefetch={false}
                        className="hidden text-muted-foreground hover:text-foreground sm:inline"
                    >
                        Projects
                    </Link>
                    <span aria-current="page" className="hidden sm:inline">
                        Profile
                    </span>
                    <ThemeToggle />
                </nav>
            </header>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-sidebar px-5 py-3 text-xs text-muted-foreground md:px-10">
                <p>
                    <strong className="font-medium text-foreground">Profile study</strong>
                    <span className="ml-3">Sample data. Changes stay in this preview.</span>
                </p>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2" htmlFor="sample-account">
                        Account
                        <select
                            id="sample-account"
                            value={scenario}
                            onChange={(event) => setScenario(event.target.value as Scenario)}
                            className="min-h-9 rounded-md border border-input bg-card px-2 text-sm text-foreground"
                        >
                            <option value="unlimited">Unlimited</option>
                            <option value="metered">Daily allowance</option>
                            <option value="unverified">Unverified email</option>
                        </select>
                    </label>
                    <Button
                        variant="utility"
                        aria-label="Reset sample data"
                        onClick={() => setRevision((value) => value + 1)}
                    >
                        <RotateCcw size={15} />
                    </Button>
                </div>
            </div>
            <Variant key={`${current}-${revision}-${scenario}`} scenario={scenario} />
            <nav ref={picker} className="proto-picker" aria-label="Prototype variants">
                <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
                {variants.map(({ name }, index) => (
                    <button
                        key={name}
                        className="proto-picker-item"
                        data-active={current === index ? "" : undefined}
                        aria-current={current === index ? "true" : undefined}
                        onClick={() => select(index)}
                    >
                        {name}
                    </button>
                ))}
            </nav>
        </div>
    );
}
