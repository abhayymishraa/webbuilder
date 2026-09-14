"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { clearSession } from "@/api/session";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const [attempt, setAttempt] = useState(0);

  const refreshCredits = useCallback(() => {
    authApi
      .getCurrentUser()
      .then((value) => {
        setUser(value);
        localStorage.setItem("user_data", JSON.stringify(value));
      })
      .catch(() =>
        setError(
          "Could not refresh your credits. Reload to see the latest balance.",
        ),
      );
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      router.replace("/signin");
      return;
    }
    let disposed = false;
    setError("");
    authApi
      .getCurrentUser()
      .then((value) => {
        if (disposed) return;
        setUser(value);
        setName(value.name);
        setBio(value.bio || "");
        localStorage.setItem("user_data", JSON.stringify(value));
        const connected = new URLSearchParams(location.hash.slice(1)).get(
          "connected",
        );
        if (connected && value.providers?.includes(connected))
          setMessage("Sign-in method connected.");
        if (location.hash) history.replaceState(null, "", location.pathname);
      })
      .catch(() => {
        if (!disposed)
          setError("Could not load your profile. Please try again.");
      });
    authApi
      .options()
      .then((value) => {
        if (!disposed) setOptions(value);
      })
      .catch(() => {});
    return () => {
      disposed = true;
    };
  }, [router, attempt]);

  function signOut() {
    clearSession();
    router.replace("/signin");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = await authApi.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
      });
      setUser(value);
      setName(value.name);
      setBio(value.bio || "");
      localStorage.setItem("user_data", JSON.stringify(value));
      toast.success("Your changes are saved.", { id: "profile-save" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your changes.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function connect(provider: "google" | "github") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { url } = await authApi.linkProvider(provider);
      window.location.assign(url);
    } catch {
      setError("Could not connect this sign-in method. Please try again.");
      setBusy(false);
    }
  }

  const dirty =
    !!user && (name.trim() !== user.name || bio.trim() !== (user.bio || ""));
  return (
    <>
      <ChatNavbar
        isAuthenticated={!!user}
        userData={user}
        onSignOut={signOut}
      />
      <div className="ember-workspace-shell flex min-h-[calc(100dvh_-_76px)] [&>.ember-workspace]:flex-1 [&>.ember-workspace]:min-w-0 [&>.ember-workspace]:w-full [&>.ember-workspace]:mx-auto max-md:min-h-[calc(100dvh_-_70px)]">
        <WorkspaceSidebar current="profile" />
        <main
          className="ember-profile w-full min-w-0 max-w-275 mx-auto py-9.5 px-[clamp(20px,_4vw,_56px)] max-md:py-6 max-md:px-4.5"
          id="main-content"
        >
          <div className="ember-profile-heading mb-6.5 [&_h1]:text-[clamp(28px,_3vw,_36px)] [&_h1]:tracking-[-1.3px] [&_h1]:font-medium [&_h1]:my-1.5 [&_h1]:mx-0 [&>p:last-child]:text-[14px] [&>p:last-child]:leading-[1.6] [&>p:last-child]:text-muted-foreground">
            <p className="ember-eyebrow uppercase tracking-[0.12em] text-[10px] font-medium text-accent-foreground mb-5.5">
              Your workspace, your way
            </p>
            <h1>Profile</h1>
            <p>A little about the person behind the ideas.</p>
          </div>
          {error && (
            <p
              role="alert"
              className="ember-error text-destructive border border-destructive bg-card py-3 px-[15px] rounded-[8px] text-[13px] leading-[1.5]"
            >
              {error}
            </p>
          )}
          {!user ? (
            error ? (
              <div className="ember-profile-loading py-10">
                <Button
                  variant="default"
                  onClick={() => setAttempt((v) => v + 1)}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <ProfileSkeleton />
            )
          ) : (
            <>
              <section
                className="ember-profile-card relative isolate overflow-hidden border border-border rounded-[18px] bg-card p-8.5 min-h-72.5 max-md:p-6 max-md:min-h-72.5"
                aria-label="Your profile overview"
              >
                <div className="ember-profile-mountain" aria-hidden="true" />
                <div className="ember-profile-identity max-w-[72%] [&_h2]:text-[25px] [&_h2]:tracking-[-.6px] [&_h2]:font-medium [&_h2]:wrap-anywhere [&>p]:text-muted-foreground [&>p]:mt-[5px] [&>p]:mx-0 [&>p]:mb-[13px] [&>p]:text-[14px] [&>p]:wrap-anywhere max-md:max-w-full">
                  <span
                    className="ember-profile-avatar grid place-items-center w-14.5 h-14.5 rounded-full bg-background border border-border text-accent-foreground text-[20px] mb-4"
                    aria-hidden="true"
                  >
                    {user.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  <h2>{user.name}</h2>
                  <p>{user.bio || "Room for your next idea."}</p>
                  <span className="ember-profile-email flex items-center gap-2 text-[13px] wrap-anywhere [&_svg]:shrink-0">
                    <Mail size={14} />
                    {user.email}
                  </span>
                  <div className="ember-profile-facts flex flex-wrap gap-y-3.5 gap-x-6 mt-[23px] text-[12px] text-muted-foreground [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[5px] [&_strong]:text-foreground [&_strong]:font-medium">
                    <span>
                      {user.credits_unlimited ? (
                        "Unlimited credits"
                      ) : (
                        <>
                          <strong>{user.tokens_remaining}</strong> credits
                          available
                        </>
                      )}
                    </span>
                    {!user.credits_unlimited &&
                      (user.tokens_reset_at ? (
                        <CreditReset
                          key={user.tokens_reset_at}
                          resetAt={user.tokens_reset_at}
                          onReset={refreshCredits}
                        />
                      ) : (
                        <span>Your next build starts a 24-hour window</span>
                      ))}
                    <span>
                      <Check size={14} /> Email verified
                    </span>
                  </div>
                </div>
              </section>
              <div className="ember-profile-settings [&_section>p]:text-[14px] [&_section>p]:leading-[1.6] [&_section>p]:text-muted-foreground grid grid-cols-[1fr_1fr] gap-[clamp(24px,_5vw,_64px)] mt-9 [&_section]:min-w-0 [&_h2]:text-[17px] [&_h2]:font-medium [&_h2]:mb-1.5 [&_.ember-form]:mt-5.5 [&_.ember-form]:gap-4.5 [&_textarea]:resize-y [&_textarea]:min-h-24 [&_textarea]:max-h-55 [&_textarea]:p-3 [&_textarea]:bg-card [&_textarea]:border [&_textarea]:border-input [&_textarea]:rounded-[8px] [&_textarea]:text-[16px] [&_.ember-form_button]:self-start max-md:grid-cols-[1fr] max-md:gap-8">
                <section aria-labelledby="details-title">
                  <h2 id="details-title">Personal details</h2>
                  <p>This is how you appear in your workspace.</p>
                  <form
                    className="ember-form flex flex-col gap-[21px] mt-7.5 [&_.ember-helper]:-mt-3"
                    onSubmit={save}
                    aria-busy={busy}
                  >
                    <label
                      className="flex flex-col gap-[9px] text-[13px]"
                      htmlFor="profile-name"
                    >
                      Name
                      <Input
                        id="profile-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        required
                        autoComplete="name"
                        disabled={busy}
                      />
                    </label>
                    <label
                      className="flex flex-col gap-[9px] text-[13px]"
                      htmlFor="profile-bio"
                    >
                      About you{" "}
                      <textarea
                        id="profile-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        maxLength={280}
                        placeholder="What do you like to make?"
                        disabled={busy}
                      />
                    </label>
                    <Button
                      variant="default"
                      disabled={busy || !dirty || !name.trim()}
                    >
                      {busy ? "Please wait…" : "Save changes"}
                    </Button>
                  </form>
                </section>
                <section aria-labelledby="signin-title">
                  <h2 id="signin-title">Sign-in methods</h2>
                  <p>Keep your ideas within reach.</p>
                  <div className="ember-profile-methods mt-4.5 [&>div]:flex [&>div]:items-center [&>div]:gap-[13px] [&>div]:min-h-[75px] [&>div]:border-b [&>div]:border-b-border [&>div>svg]:shrink-0 [&_span]:flex-1 [&_span]:text-[14px] [&_small]:block [&_small]:text-muted-foreground [&_small]:text-[12px] [&_small]:mt-1 [&_button]:py-2.5 [&_button]:px-3.5">
                    {(["google", "github"] as const).map((provider) => {
                      const connected = user.providers?.includes(provider);
                      return (
                        <div key={provider}>
                          {provider === "google" ? (
                            <SiGoogle aria-hidden="true" />
                          ) : (
                            <SiGithub aria-hidden="true" />
                          )}
                          <span>
                            {provider === "google" ? "Google" : "GitHub"}
                            <small>
                              {connected
                                ? "Connected"
                                : options?.providers[provider]
                                  ? "Not connected"
                                  : "Awaiting setup"}
                            </small>
                          </span>
                          {connected ? (
                            <Check size={17} aria-label="Connected" />
                          ) : (
                            <Button
                              variant="secondary"
                              disabled={busy || !options?.providers[provider]}
                              onClick={() => connect(provider)}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    <div>
                      <Mail size={18} />
                      <span>
                        Email<small>Verified</small>
                      </span>
                      <Check size={17} aria-label="Verified" />
                    </div>
                  </div>
                  {user.created_at && (
                    <p className="ember-profile-joined mt-[25px] text-[12px]!">
                      Member since{" "}
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </section>
              </div>
              <p
                className="ember-profile-status min-h-6 mt-5 text-accent-foreground text-[14px]"
                role="status"
              >
                {message}
              </p>
            </>
          )}
        </main>
      </div>
    </>
  );
}
