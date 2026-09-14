import Link from "next/link";

const studies = [
  { id: "prompt", href: "/prototypes/ember-prompt", label: "Prompt" },
  {
    id: "components",
    href: "/prototypes/ember-components",
    label: "Components",
  },
] as const;

export function StudyNav({
  active,
}: {
  active: (typeof studies)[number]["id"];
}) {
  return (
    <header className="study-nav-header relative z-1 w-full max-w-290 min-h-19 mx-auto py-4 px-8 flex items-center justify-between gap-y-3 gap-x-8 text-[#eee3db] font-sans [&_a]:min-h-11 [&_a]:inline-flex [&_a]:items-center [&_a]:no-underline [&_nav]:flex [&_nav]:gap-6 [&_nav_a]:text-[13px] [&_nav_a]:text-[#b7a79c] [&_nav_a[aria-current=page]]:text-[#ff946e] [&_nav_a[aria-current=page]]:underline [&_nav_a[aria-current=page]]:underline-offset-[7px] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-solid [&_a:focus-visible]:outline-[#ff946e] [&_a:focus-visible]:outline-offset-1 pointer-fine:[&_a:hover]:text-[#fff4eb] max-[601px]:py-3 max-[601px]:px-5.5 max-[601px]:flex-wrap max-[601px]:gap-y-0 max-[601px]:gap-x-6 max-[601px]:[&_nav]:gap-6">
      <Link
        href="/"
        className="study-nav-home gap-2 text-[18px] font-semibold tracking-[-.04em] [&_span]:text-[13px] [&_span]:font-normal [&_span]:text-[#b7a79c] [&_span]:tracking-[0]"
      >
        webbuilder <span>/ studies</span>
      </Link>
      <nav aria-label="Design studies">
        {studies.map((study) => (
          <Link
            key={study.id}
            href={study.href}
            aria-current={active === study.id ? "page" : undefined}
          >
            {study.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
