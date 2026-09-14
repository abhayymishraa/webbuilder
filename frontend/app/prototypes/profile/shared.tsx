"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Mail, ShieldCheck } from "lucide-react";
import { SiGithub, SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditReset } from "@/components/ember/CreditReset";

export type Scenario = "unlimited" | "metered" | "unverified";
export type ProfileModel = ReturnType<typeof useProfileModel>;

// Deliberately isolated fixtures. Prototype controls never call account APIs.
export function useProfileModel(scenario: Scenario) {
  const [profile, setProfile] = useState({ name: "Abhay Mishra", bio: "Building useful things, one idea at a time." });
  const [github, setGithub] = useState(false);
  const [verified, setVerified] = useState(scenario !== "unverified");
  const [notice, setNotice] = useState("");
  return { profile, setProfile, github, setGithub, verified, setVerified, notice, setNotice, scenario };
}

export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return <span aria-hidden="true" className={`grid shrink-0 place-items-center border border-border bg-background font-medium text-accent-foreground ${large ? "size-20 rounded-xl text-3xl" : "size-12 rounded-lg text-lg"}`}>{name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span>;
}

export function Verification({ model }: { model: ProfileModel }) {
  return <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">{model.verified ? <ShieldCheck size={16} aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}{model.verified ? "Email verified" : "Email not verified"}</span>;
}

export function Details({ model, onDone }: { model: ProfileModel; onDone?: () => void }) {
  const [name, setName] = useState(model.profile.name);
  const [bio, setBio] = useState(model.profile.bio);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const dirty = name.trim() !== model.profile.name || bio.trim() !== model.profile.bio;
  return <form className="grid gap-5" aria-busy={saving} onSubmit={event => {
    event.preventDefault();
    if (!dirty || !name.trim() || saving) return;
    setSaving(true);
    model.setNotice("");
    timer.current = setTimeout(() => {
      model.setProfile({ name: name.trim(), bio: bio.trim() });
      setSaving(false);
      model.setNotice("Changes saved in this preview.");
      onDone?.();
    }, 350);
  }}>
    <label className="grid gap-2 text-sm" htmlFor="sample-name">Display name<Input id="sample-name" autoComplete="off" maxLength={100} required value={name} disabled={saving} onChange={event => setName(event.target.value)} /></label>
    <label className="grid gap-2 text-sm" htmlFor="sample-bio">About you<textarea id="sample-bio" className="min-h-28 w-full resize-y rounded-lg border border-input bg-card p-3 text-base leading-relaxed disabled:opacity-50" maxLength={280} rows={3} value={bio} disabled={saving} onChange={event => setBio(event.target.value)} aria-describedby="bio-help" /></label>
    <p id="bio-help" className="-mt-3 text-xs text-muted-foreground">A short introduction for your workspace. {bio.length}/280</p>
    <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={!dirty || !name.trim() || saving}>{saving ? "Saving…" : "Save changes"}</Button>{onDone && <Button type="button" variant="secondary" disabled={saving} onClick={onDone}>Cancel</Button>}</div>
  </form>;
}

export function SignInMethods({ model }: { model: ProfileModel }) {
  return <div>
    <div className="flex flex-wrap items-center gap-3 border-b border-border py-4"><SiGoogle size={18} aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">Google</p><p className="mt-1 text-xs text-muted-foreground">Connected to this account</p></div><Check size={18} className="text-accent-foreground" aria-label="Connected" /></div>
    <div className="flex flex-wrap items-center gap-3 border-b border-border py-4"><SiGithub size={18} aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">GitHub</p><p className="mt-1 text-xs text-muted-foreground">{model.github ? "Connected to this account" : "Use GitHub to sign in"}</p></div>{model.github ? <Check size={18} className="text-accent-foreground" aria-label="Connected" /> : <Button variant="secondary" onClick={() => { model.setGithub(true); model.setNotice("GitHub connection simulated. Your real account is unchanged."); }}>Connect</Button>}</div>
    <div className="flex flex-wrap items-center gap-3 py-4"><Mail size={18} aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">Email</p><p className="mt-1 break-all text-xs text-muted-foreground">abhay@example.com</p></div><span className="text-xs text-muted-foreground">{model.verified ? "Verified" : "Unverified"}</span></div>
    {!model.verified && <div className="mt-3 border border-border bg-secondary p-4"><p className="text-sm leading-relaxed">Verify your email before you can start a build.</p><Button className="mt-3" variant="secondary" onClick={() => { model.setVerified(true); model.setNotice("Verification simulated. No email was sent."); }}>Preview verification</Button></div>}
  </div>;
}

export function Credits({ scenario }: { scenario: Scenario }) {
  const [resetAt, setResetAt] = useState<string | null>(null);
  const [reset, setReset] = useState(false);
  useEffect(() => { setResetAt(new Date(Date.now() + (7 * 3600 + 42 * 60) * 1000).toISOString()); }, []);
  const onReset = useCallback(() => setReset(true), []);
  const unlimited = scenario === "unlimited";
  return <div>
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><strong className="text-4xl font-medium tracking-[-0.03em] tabular-nums">{unlimited ? "Unlimited" : reset ? "5" : "3"}</strong>{!unlimited && <span className="text-sm text-muted-foreground">of 5 credits available</span>}</div>
    <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{unlimited ? "No daily credit limit applies to this account." : "One credit starts a generation request. Your available credits refresh after the daily window."}</p>
    {!unlimited && <div className="mt-5 border-t border-border pt-4 text-sm text-accent-foreground [&_span]:inline-flex [&_span]:items-center [&_span]:gap-2">{resetAt ? <CreditReset resetAt={resetAt} onReset={onReset} /> : "Loading reset time…"}</div>}
    <p className="mt-4 text-xs text-muted-foreground">{unlimited ? "No reset timer needed." : "Illustrative credit balance and reset time."}</p>
  </div>;
}

export function Notice({ model }: { model: ProfileModel }) {
  return <p role="status" className="min-h-6 text-sm leading-relaxed text-accent-foreground">{model.notice}</p>;
}
