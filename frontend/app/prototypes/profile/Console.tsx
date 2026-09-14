"use client";

import { useState } from "react";
import { ArrowUpRight, Fingerprint, SlidersHorizontal, Zap } from "lucide-react";
import { Avatar, Credits, Details, Notice, SignInMethods, Verification, useProfileModel, type Scenario } from "./shared";

const sections = [{ name: "Personal details", icon: SlidersHorizontal }, { name: "Build credits", icon: Zap }, { name: "Sign-in methods", icon: Fingerprint }];

export default function Console({ scenario }: { scenario: Scenario }) {
  const model = useProfileModel(scenario);
  const [tab, setTab] = useState(0);
  return <main id="main-content" className="mx-auto w-full max-w-6xl px-5 py-10 pb-28 md:px-10 lg:py-14">
    <div className="flex items-baseline justify-between gap-4"><h1 className="text-3xl font-medium tracking-[-0.03em]">Account settings</h1><span className="hidden text-xs text-muted-foreground sm:block">Member since September 2026</span></div>
    <div className="mt-8 overflow-hidden rounded-xl border border-border">
      <header className="relative isolate flex min-h-40 items-center gap-5 bg-card p-6 sm:p-8"><div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-[url('/art/profile-mountain.svg')] bg-cover bg-right opacity-35" /><Avatar name={model.profile.name} large /><div className="min-w-0"><h2 className="break-words text-xl font-medium">{model.profile.name}</h2><p className="mb-3 mt-1 break-all text-sm text-muted-foreground">abhay@example.com</p><Verification model={model} /></div></header>
      <div className="grid border-t border-border md:min-h-[470px] md:grid-cols-[225px_minmax(0,1fr)]">
        <div role="tablist" aria-label="Account settings" className="flex gap-1 overflow-x-auto border-b border-border bg-sidebar p-3 md:flex-col md:gap-2 md:border-r md:border-b-0 md:p-5" onKeyDown={event => {
          const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? (tab + 1) % 3 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (tab + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
          if (next === null) return;
          event.preventDefault(); setTab(next); document.getElementById(`account-tab-${next}`)?.focus();
        }}>
          {sections.map(({ name, icon: Icon }, index) => <button key={name} id={`account-tab-${index}`} role="tab" aria-selected={tab === index} aria-controls={`account-panel-${index}`} tabIndex={tab === index ? 0 : -1} className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-left text-sm whitespace-nowrap text-muted-foreground hover:bg-secondary aria-selected:bg-accent aria-selected:text-accent-foreground" onClick={() => setTab(index)}><Icon size={17} aria-hidden="true" />{name}</button>)}
        </div>
        <section id={`account-panel-${tab}`} role="tabpanel" aria-labelledby={`account-tab-${tab}`} tabIndex={0} className="min-w-0 p-6 sm:p-8 lg:p-10">
          <h2 className="text-xl font-medium tracking-tight">{sections[tab].name}</h2>
          <p className="mb-7 mt-2 text-sm text-muted-foreground">{tab === 0 ? "Update the details you use in your workspace." : tab === 1 ? "See what is available before your next build." : "Keep access to your projects in your hands."}</p>
          <div className="max-w-lg">{tab === 0 && <Details model={model} />}{tab === 1 && <><Credits scenario={scenario} /><div className="mt-8 flex items-start gap-3 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground"><ArrowUpRight size={18} className="shrink-0" aria-hidden="true" /><p>{model.verified ? "Your email is verified. You can start a new project from the workspace." : "Verify your email in Sign-in methods before starting a build."}</p></div></>}{tab === 2 && <SignInMethods model={model} />}</div>
        </section>
      </div>
    </div>
    <div className="mt-5"><Notice model={model} /></div>
  </main>;
}
