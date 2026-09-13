"use client";

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
    setReady(true);
    authApi
      .getCurrentUser()
      .then((data) => {
        if (!disposed) setUser(data);
      })
      .catch(() => {
        /* The API client handles an expired session. */
      });
    return () => {
      disposed = true;
    };
  }, [router]);
  function signOut() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    router.push("/");
  }
  return (
    <>
      <ChatNavbar isAuthenticated={ready} userData={user} onSignOut={signOut} />
      <div className="ember-workspace-shell">
        <WorkspaceSidebar current="projects" />
        <main className="ember-workspace" id="main-content">
          <div className="ember-page-title">
            <div>
              <p className="ember-eyebrow">Your workspace</p>
              <h1>
                Good ideas
                <br />
                deserve a place.
              </h1>
              <p>Everything you’re making, ready to pick up again.</p>
            </div>
            <Link href="/chat" className="ember-button">
              <Plus size={17} />
              New project
            </Link>
          </div>
          {ready ? (
            <ProjectCollection />
          ) : (
            <>
              <div className="ember-project-toolbar" aria-hidden="true">
                <div className="ember-search"><Skeleton className="h-5 w-44 max-w-full" /></div>
              </div>
              <ProjectCollectionSkeleton />
            </>
          )}
        </main>
      </div>
    </>
  );
}
