"use client";
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
import { ProfileIdentityCard } from "@/components/ember/ProfileIdentityCard";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [options, setOptions] = useState<AuthOptions | null>(null);
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

  async function save(name: string, bio: string): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = await authApi.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
      });
      setUser(value);
      localStorage.setItem("user_data", JSON.stringify(value));
      toast.success("Your changes are saved.", { id: "profile-save" });
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your changes.",
      );
      return false;
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
              <ProfileIdentityCard user={user} busy={busy} onSave={save} />
              <div className="mt-9 grid gap-8 md:grid-cols-2 md:gap-12 [&_h2]:mb-1.5 [&_h2]:text-[17px] [&_h2]:font-medium [&_section>p]:text-sm [&_section>p]:leading-relaxed [&_section>p]:text-muted-foreground">
                <section aria-labelledby="credits-title">
                  <h2 id="credits-title">Build credits</h2>
                  <p className="mt-4 text-3xl! font-medium text-foreground!">
                    {user.credits_unlimited ? "Unlimited" : user.tokens_remaining}
                  </p>
                  <p className="mt-2">{user.credits_unlimited ? "No daily credit limit applies to this account." : "Credits available for your next build."}</p>
                  {!user.credits_unlimited && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      {user.tokens_reset_at ? (
                        <CreditReset key={user.tokens_reset_at} resetAt={user.tokens_reset_at} onReset={refreshCredits} />
                      ) : "Your next build starts a 24-hour window"}
                    </div>
                  )}
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
                        Email<small>{user.email_verified ? "Verified" : "Not verified"}</small>
                      </span>
                      {user.email_verified && <Check size={17} aria-label="Verified" />}
                    </div>
                  </div>
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
