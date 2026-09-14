import { buttonVariants } from "@/components/ui/button";
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
      <header className="ember-nav min-h-22 max-w-345 m-auto py-5 px-12 flex flex-wrap items-center justify-between gap-x-[25px] gap-y-2 [&_nav]:flex [&_nav]:gap-6.5 [&_nav]:text-[13px] [&_nav]:text-muted-foreground max-md:py-4.5 max-md:px-5.5 max-md:min-h-19 max-md:[&_nav]:hidden">
        <Brand />
        <div className="ember-row ml-auto flex items-center gap-3.5">
          <ThemeToggle />
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href={signup ? "/signin" : "/signup"}
          >
            {signup ? "Sign in" : "Create account"}
          </Link>
        </div>
      </header>
      <main
        className="ember-auth-layout max-w-275 mt-10 mx-auto mb-22.5 py-0 px-9 grid grid-cols-[1fr_0.9fr] gap-27.5 items-center min-h-[calc(100dvh_-_220px)] max-[1101px]:gap-[65px] max-md:block max-md:my-10 max-md:mx-auto max-md:py-0 max-md:px-6 max-md:min-h-0 max-md:max-w-120"
        id="main-content"
      >
        <div className="ember-auth-story [&_.ember-art]:aspect-[1.3] [&_.ember-art-title]:text-[46px] [&_.ember-art-title]:my-[35px] [&_h1]:text-[31px] [&_h1]:font-medium [&_h1]:leading-[1.15] [&_h1]:tracking-[-1px] [&_h1]:mt-[25px] [&>p]:text-[14px] [&>p]:leading-[1.7] [&>p]:text-muted-foreground [&>p]:max-w-92.5 [&>p]:mt-4 max-md:hidden">
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
        <section className="ember-auth-form [&_h2]:text-[34px] [&_h2]:font-medium [&_h2]:tracking-[-1.3px] [&_h2]:leading-[1.2] [&>p]:text-muted-foreground [&>p]:text-[14px] [&>p]:mt-3 max-md:pb-10 max-md:[&_h2]:text-[32px]">
          <h2>
            {title || (signup ? "Create your workspace" : "Welcome back")}
          </h2>
          <p>
            {description ||
              (signup
                ? "A place for your next good idea."
                : "Sign in to continue making.")}
          </p>
          {children}
        </section>
      </main>
    </div>
  );
}
