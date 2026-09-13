import { cn } from "@/lib/utils";
import styles from "./shine-border.module.css";

// Adapted from Magic UI's Shine Border (MIT):
// https://magicui.design/docs/components/shine-border
export function ShineBorder({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn(styles.border, className)} />;
}
