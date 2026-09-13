"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Mail } from "lucide-react";
import { SiGithub, SiGoogle } from "react-icons/si";
import { authApi, type AuthOptions, type UserData } from "@/api";
import { ChatNavbar } from "@/components/chat";
import { WorkspaceSidebar } from "@/components/ember/WorkspaceSidebar";
import { CreditReset } from "@/components/ember/CreditReset";
import { ProfileSkeleton } from "@/components/ember/ProfileSkeleton";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [options, setOptions] = useState<AuthOptions | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState("");
  const [attempt, setAttempt] = useState(0);

  const refreshCredits = useCallback(() => {
    authApi.getCurrentUser().then(value => {
      setUser(value);
      localStorage.setItem("user_data", JSON.stringify(value));
    }).catch(() => setError("Could not refresh your credits. Reload to see the latest balance."));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) { router.replace("/signin"); return; }
    let disposed = false;
    setError("");
    authApi.getCurrentUser().then(value => {
      if (disposed) return;
      setUser(value); setName(value.name); setBio(value.bio || "");
      localStorage.setItem("user_data", JSON.stringify(value));
      const connected = new URLSearchParams(location.hash.slice(1)).get("connected");
      if (connected && value.providers?.includes(connected)) setMessage("Sign-in method connected.");
      if (location.hash) history.replaceState(null, "", location.pathname);
    }).catch(() => { if (!disposed) setError("Could not load your profile. Please try again."); });
    authApi.options().then(value => { if (!disposed) setOptions(value); }).catch(() => {});
    return () => { disposed = true; };
  }, [router, attempt]);

  function signOut() {
    localStorage.removeItem("auth_token"); localStorage.removeItem("user_data"); router.replace("/signin");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(""); setMessage(""); setSaved("");
    try {
      const value = await authApi.updateProfile({ name: name.trim(), bio: bio.trim() });
      setUser(value); setName(value.name); setBio(value.bio || "");
      localStorage.setItem("user_data", JSON.stringify(value)); setSaved("Your changes are saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save your changes."); }
    finally { setBusy(false); }
  }

  async function connect(provider: "google" | "github") {
    setBusy(true); setError(""); setMessage("");
    try { const { url } = await authApi.linkProvider(provider); window.location.assign(url); }
    catch { setError("Could not connect this sign-in method. Please try again."); setBusy(false); }
  }

  const dirty = !!user && (name.trim() !== user.name || bio.trim() !== (user.bio || ""));
  return <>
    <ChatNavbar isAuthenticated={!!user} userData={user} onSignOut={signOut} />
    <div className="ember-workspace-shell">
      <WorkspaceSidebar current="profile" />
      <main className="ember-profile" id="main-content">
        <div className="ember-profile-heading"><p className="ember-eyebrow">Your workspace, your way</p><h1>Profile</h1><p>A little about the person behind the ideas.</p></div>
        {error && <p role="alert" className="ember-error">{error}</p>}
        {!user ? (error ? <div className="ember-profile-loading"><button className="ember-button" onClick={() => setAttempt(v => v + 1)}>Try again</button></div> : <ProfileSkeleton />) : <>
          <section className="ember-profile-card" aria-label="Your profile overview">
            <div className="ember-profile-mountain" aria-hidden="true" />
            <div className="ember-profile-identity">
              <span className="ember-profile-avatar" aria-hidden="true">{user.name.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span>
              <h2>{user.name}</h2><p>{user.bio || "Room for your next idea."}</p>
              <span className="ember-profile-email"><Mail size={14} />{user.email}</span>
              <div className="ember-profile-facts">
                <span>{user.credits_unlimited ? "Unlimited credits" : <><strong>{user.tokens_remaining}</strong> credits available</>}</span>
                {!user.credits_unlimited && (user.tokens_reset_at
                  ? <CreditReset key={user.tokens_reset_at} resetAt={user.tokens_reset_at} onReset={refreshCredits} />
                  : <span>Your next build starts a 24-hour window</span>)}
                <span><Check size={14} /> Email verified</span>
              </div>
            </div>
          </section>
          <div className="ember-profile-settings">
            <section aria-labelledby="details-title"><h2 id="details-title">Personal details</h2><p>This is how you appear in your workspace.</p>
              <form className="ember-form" onSubmit={save} aria-busy={busy}>
                <label htmlFor="profile-name">Name<input id="profile-name" value={name} onChange={e => { setName(e.target.value); setSaved(""); }} maxLength={100} required autoComplete="name" disabled={busy} /></label>
                <label htmlFor="profile-bio">About you <textarea id="profile-bio" value={bio} onChange={e => { setBio(e.target.value); setSaved(""); }} rows={3} maxLength={280} placeholder="What do you like to make?" disabled={busy} /></label>
                <button className="ember-button" disabled={busy || !dirty || !name.trim()}>{busy ? "Please wait…" : "Save changes"}</button>
                <p role="status" className="ember-helper">{saved}</p>
              </form>
            </section>
            <section aria-labelledby="signin-title"><h2 id="signin-title">Sign-in methods</h2><p>Keep your ideas within reach.</p>
              <div className="ember-profile-methods">
                {(["google", "github"] as const).map(provider => {
                  const connected = user.providers?.includes(provider);
                  return <div key={provider}>{provider === "google" ? <SiGoogle aria-hidden="true" /> : <SiGithub aria-hidden="true" />}<span>{provider === "google" ? "Google" : "GitHub"}<small>{connected ? "Connected" : options?.providers[provider] ? "Not connected" : "Awaiting setup"}</small></span>{connected ? <Check size={17} aria-label="Connected" /> : <button className="ember-button ember-secondary" disabled={busy || !options?.providers[provider]} onClick={() => connect(provider)}>Connect</button>}</div>;
                })}
                <div><Mail size={18} /><span>Email<small>Verified</small></span><Check size={17} aria-label="Verified" /></div>
              </div>
              {user.created_at && <p className="ember-profile-joined">Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>}
            </section>
          </div>
          <p className="ember-profile-status" role="status">{message}</p>
        </>}
      </main>
    </div>
  </>;
}
