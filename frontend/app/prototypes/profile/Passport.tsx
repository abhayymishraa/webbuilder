"use client";

import { Credits, Details, Notice, SignInMethods, Verification, useProfileModel, type Scenario } from "./shared";

export default function Passport({ scenario }: { scenario: Scenario }) {
  const model = useProfileModel(scenario);
  return <main id="main-content" className="mx-auto w-full max-w-6xl px-5 py-10 pb-28 md:px-10 lg:py-14">
    <h1 className="text-3xl font-medium tracking-[-0.03em]">Your profile</h1>
    <p className="mt-2 text-sm text-muted-foreground">Your identity, your access, your room to build.</p>
    <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
      <aside className="min-w-0">
        <section
          className="border border-border border-t-2 border-t-primary bg-card"
          aria-label="Profile identity"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Workspace profile</span>
            <span className="font-mono text-xs text-accent-foreground" aria-hidden="true">
              {model.profile.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}
            </span>
          </div>
          <div className="px-5 pt-7 pb-6 sm:px-6">
            <h2 className="wrap-anywhere text-[clamp(2rem,3.2vw,3rem)] leading-[1.05] font-semibold uppercase tracking-[-0.04em]">
              {model.profile.name}
            </h2>
            <p className="mt-4 max-w-[34ch] break-words text-sm leading-relaxed text-muted-foreground">
              {model.profile.bio || "Add an introduction in personal details."}
            </p>
          </div>
          <div
            className="h-20 border-y border-border bg-[url('/art/profile-mountain.svg')] bg-cover bg-[position:right_48%]"
            aria-hidden="true"
          />
          <dl className="grid gap-5 px-5 py-5 sm:px-6">
            <div>
              <dt className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Email address</dt>
              <dd className="break-all text-sm">abhay@example.com</dd>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
              <div>
                <dt className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Member since</dt>
                <dd className="text-sm tabular-nums">September 2026</dd>
              </div>
              <div><dt className="sr-only">Verification status</dt><dd><Verification model={model} /></dd></div>
            </div>
          </dl>
        </section>
        <section className="mt-8 px-1" aria-labelledby="passport-credits"><h2 id="passport-credits" className="mb-4 text-sm font-medium">Build credits</h2><Credits scenario={scenario} /></section>
      </aside>
      <div className="grid min-w-0 gap-9"><section aria-labelledby="passport-details"><h2 id="passport-details" className="text-lg font-medium">Personal details</h2><p className="mb-6 mt-2 text-sm text-muted-foreground">Make your workspace feel like yours.</p><Details model={model} /></section><section className="border-t border-border pt-7" aria-labelledby="passport-access"><h2 id="passport-access" className="text-lg font-medium">Sign-in methods</h2><p className="mt-2 text-sm text-muted-foreground">Choose how you access WebBuilder.</p><SignInMethods model={model} /></section><Notice model={model} /></div>
    </div>
  </main>;
}
