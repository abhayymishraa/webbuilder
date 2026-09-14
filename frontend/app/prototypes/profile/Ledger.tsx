"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Credits, Details, Notice, SignInMethods, Verification, useProfileModel, type Scenario } from "./shared";

export default function Ledger({ scenario }: { scenario: Scenario }) {
  const model = useProfileModel(scenario);
  const [editing, setEditing] = useState(false);
  return <main id="main-content" className="mx-auto w-full max-w-5xl px-5 py-10 pb-28 md:px-10 lg:py-14 [&_button]:rounded-none [&_input]:rounded-none [&_textarea]:rounded-none">
    <h1 className="text-3xl font-medium tracking-[-0.03em]">Profile & access</h1>
    <div className="mt-8 border-t-2 border-foreground">
      <section className="grid gap-6 border-b border-border py-8 md:grid-cols-[190px_minmax(0,1fr)]" aria-labelledby="ledger-identity"><div><h2 id="ledger-identity" className="text-sm font-medium">Personal details</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Your name and introduction.</p></div><div className="min-w-0">{editing ? <Details model={model} onDone={() => setEditing(false)} /> : <><div className="flex items-start justify-between gap-5"><h3 className="break-words text-3xl font-medium tracking-[-0.03em] sm:text-4xl">{model.profile.name}</h3><Button variant="utility" className="gap-2" onClick={() => setEditing(true)}><Pencil size={14} aria-hidden="true" />Edit</Button></div><p className="mt-3 max-w-lg break-words text-base leading-relaxed text-muted-foreground">{model.profile.bio || "Add a short introduction to your profile."}</p><p className="mt-6 text-xs text-muted-foreground">Member since September 2026</p></>}</div></section>
      <section className="grid gap-6 border-b border-border py-8 md:grid-cols-[190px_minmax(0,1fr)]" aria-labelledby="ledger-credits"><div><h2 id="ledger-credits" className="text-sm font-medium">Build credits</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Your generation allowance.</p></div><Credits scenario={scenario} /></section>
      <section className="grid gap-6 py-8 md:grid-cols-[190px_minmax(0,1fr)]" aria-labelledby="ledger-access"><div><h2 id="ledger-access" className="text-sm font-medium">Account access</h2><p className="mb-4 mt-2 text-xs leading-relaxed text-muted-foreground">Your email and sign-in methods.</p><Verification model={model} /></div><div className="min-w-0 -mt-4"><SignInMethods model={model} /></div></section>
    </div>
    <Notice model={model} />
  </main>;
}
