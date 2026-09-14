"use client";

// Interaction patterns adapted from Beautiful UI, MIT © 2026 Shane Levine.
// See ../ember/BEAUTIFUL-UI-LICENSE. All progress comes from recorded run events.

export function CodeListing({ value, language = "output" }: { value: string; language?: string }) {
    return (
        <div className="transcript-code min-w-0 max-w-full border border-border rounded-[4px] my-2 mx-0 bg-background whitespace-normal [&_pre]:overflow-auto [&_pre]:max-h-70 [&_pre]:m-0 [&_pre]:py-2 [&_pre]:px-0 [&_pre]:[font:11px/1.75_ui-monospace,_monospace] [&_pre]:whitespace-pre [&_pre:focus-visible]:outline-2 [&_pre:focus-visible]:outline-solid [&_pre:focus-visible]:outline-primary [&_pre:focus-visible]:outline-offset-0.5">
            <div className="transcript-codeHeader font-mono text-[11px] text-muted-foreground py-[7px] px-2.5 border-b border-b-border">
                {language}
            </div>
            <pre tabIndex={0} aria-label={`${language} listing`}>
                <code>
                    {value.split("\n").map((line, index) => (
                        <span
                            className="transcript-codeLine flex min-w-max [&>span:last-child]:pr-3 [&[data-diff=add]]:bg-[#319d4920] [&[data-diff=remove]]:bg-[#dc504320]"
                            data-diff={
                                language === "diff"
                                    ? line.startsWith("+")
                                        ? "add"
                                        : line.startsWith("-")
                                          ? "remove"
                                          : undefined
                                    : undefined
                            }
                            key={index}
                        >
                            <span
                                aria-hidden="true"
                                className="transcript-lineNumber w-9.5 pr-2.5 shrink-0 text-right text-muted-foreground select-none opacity-65"
                            >
                                {index + 1}
                            </span>
                            <span>{line || " "}</span>
                        </span>
                    ))}
                </code>
            </pre>
        </div>
    );
}
