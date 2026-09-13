import Link from "next/link";
import { Brand, EmberArtwork } from "./Brand";
import { ThemeToggle } from "./ThemeProvider";

export function AuthFrame({
  signup = false,
  title,
  description,
  children,
}: {
  signup?: boolean;
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ember-auth-page">
      <header className="ember-nav">
        <Brand />
        <div className="ember-row">
          <ThemeToggle />
          <Link
            className="ember-button ember-secondary"
            href={signup ? "/signin" : "/signup"}
          >
            {signup ? "Sign in" : "Create account"}
          </Link>
        </div>
      </header>
      <main className="ember-auth-layout" id="main-content">
        <div className="ember-auth-story">
          <EmberArtwork />
          <h1>
            {signup
              ? "Your next idea starts here."
              : "Pick up where you left off."}
          </h1>
          <p>
            One workspace for the conversation, the app, and all the little
            changes that make it yours.
          </p>
        </div>
        <section className="ember-auth-form">
          <h2>{title || (signup ? "Create your workspace" : "Welcome back")}</h2>
          <p>
            {description || (signup
              ? "A place for your next good idea."
              : "Sign in to continue making.")}
          </p>
          {children}
        </section>
      </main>
    </div>
  );
}
