"use client";
import { buttonVariants } from "@/components/ui/button";

import { clearSession } from "@/api/session";

import { WorkspaceSidebar } from "@/components/ember/WorkspaceSidebar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { authApi, type UserData } from "@/api";
import { ChatNavbar } from "@/components/chat/ChatNavbar";
import { ProjectCollection } from "@/components/chat/ProjectCollection";
import { ProjectCollectionSkeleton } from "@/components/chat/ProjectCollectionSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      router.replace("/signin");
      return;
    }
    let disposed = false;
    authApi
      .getCurrentUser()
      .then((data) => {
        if (!disposed) setUser(data);
      })
      .catch(() => {
        /* The API client handles an expired session. */
      })
      .finally(() => {
        if (!disposed) setReady(true);
      });
    return () => {
      disposed = true;
    };
  }, [router]);
  function signOut() {
    clearSession();
    router.push("/");
  }
  return (
    <>
      <ChatNavbar isAuthenticated={ready} userData={user} onSignOut={signOut} />
      <div className="ember-workspace-shell flex min-h-[calc(100dvh_-_76px)] [&>.ember-workspace]:flex-1 [&>.ember-workspace]:min-w-0 [&>.ember-workspace]:w-full [&>.ember-workspace]:mx-auto max-md:min-h-[calc(100dvh_-_70px)]">
        <WorkspaceSidebar current="projects" />
        <main
          className="ember-workspace max-w-295 m-auto pt-18 px-10 pb-25 max-md:pt-[45px] max-md:px-5.5 max-md:pb-[65px]"
          id="main-content"
        >
          <div className="ember-page-title flex items-center justify-between gap-7.5 mb-9.5 [&_h1]:text-[clamp(32px,_4vw,_46px)] [&_h1]:leading-[1.08] [&_h1]:tracking-[-1.8px] [&_h1]:font-medium [&_p:not(.ember-eyebrow)]:text-[14px] [&_p:not(.ember-eyebrow)]:leading-[1.7] [&_p:not(.ember-eyebrow)]:text-muted-foreground [&_p:not(.ember-eyebrow)]:mt-4 max-md:items-start max-md:flex-col max-md:gap-5">
            <div>
              <p className="ember-eyebrow uppercase tracking-[0.12em] text-[10px] font-medium text-accent-foreground mb-5.5">
                Your workspace
              </p>
              <h1>
                Good ideas
                <br />
                deserve a place.
              </h1>
              <p>Everything you’re making, ready to pick up again.</p>
            </div>
            <Link
              href="/chat"
              className={buttonVariants({ variant: "default" })}
            >
              <Plus size={17} />
              New project
            </Link>
          </div>
          {ready ? (
            <ProjectCollection />
          ) : (
            <>
              <div
                className="ember-project-toolbar flex items-center justify-between gap-5 mb-[25px]"
                aria-hidden="true"
              >
                <div className="ember-search flex items-center gap-2.5 max-w-95 w-full border border-input rounded-[8px] py-2.5 px-3 [&_input]:w-full [&_input]:min-w-0 [&_input]:bg-transparent [&_input]:border-0 [&_input]:text-foreground [&_input]:outline-none [&_input]:text-[14px] focus-within:outline-2 focus-within:outline-solid focus-within:outline-ring focus-within:outline-offset-0.5">
                  <Skeleton className="h-5 w-44 max-w-full" />
                </div>
              </div>
              <ProjectCollectionSkeleton />
            </>
          )}
        </main>
      </div>
    </>
  );
}
