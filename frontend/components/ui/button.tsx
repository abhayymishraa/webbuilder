import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const solid =
    "ember-button gap-2.5 min-h-[43px] rounded-[8px] border text-[13px] font-medium leading-[1.25] whitespace-nowrap no-underline shadow-none [transition:opacity_140ms_ease,transform_140ms_var(--ease-out)] disabled:opacity-45 [&:not(:disabled):active]:scale-[0.98] pointer-fine:hover:opacity-88 motion-reduce:transition-opacity motion-reduce:duration-120 motion-reduce:[&:not(:disabled):active]:scale-100 focus-visible:active:scale-100";

export const buttonVariants = cva(
    "inline-flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                utility:
                    "transcript-utility gap-1.5 min-w-11 min-h-11 text-muted-foreground bg-transparent border-0 rounded-[4px] text-[12px] hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-default focus-visible:outline-primary focus-visible:outline-offset-0.5",
                default: `${solid} px-4.5 py-3 border-transparent bg-primary text-primary-foreground`,
                secondary: `${solid} ember-secondary px-4.5 py-3 border-border bg-card text-foreground pointer-fine:hover:bg-secondary`,
                send: `${solid} ember-send w-9 min-h-9 p-0 border-transparent bg-primary text-primary-foreground`,
                icon: "ember-icon size-9 shrink-0 rounded-[8px] border border-transparent bg-transparent text-muted-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground pointer-fine:hover:bg-secondary pointer-fine:hover:text-foreground",
                tab: "ember-tab gap-[7px] rounded-[6px] border-0 bg-transparent px-3 py-2 text-muted-foreground whitespace-nowrap aria-pressed:bg-secondary aria-pressed:text-foreground pointer-fine:hover:bg-secondary pointer-fine:hover:text-foreground",
            },
        },
        defaultVariants: { variant: "default" },
    },
);

export function Button({
    className,
    variant,
    ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
    return (
        <button
            data-slot="button"
            className={cn(buttonVariants({ variant }), className)}
            {...props}
        />
    );
}
