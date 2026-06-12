import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "default"
  | "solid"
  | "outline"
  | "ghost"
  | "accent"
  | "positive"
  | "warning"
  | "danger";

const tones: Record<Tone, string> = {
  default: "bg-paper/[0.06] text-paper/80 border border-paper/10",
  solid: "bg-accent text-accent-fg border border-transparent",
  outline: "bg-transparent text-paper/70 border border-paper/20",
  ghost: "bg-transparent text-paper/50 border border-transparent",
  accent: "bg-accent/15 text-accent border border-accent/25",
  positive: "bg-positive/15 text-positive border border-positive/25",
  warning: "bg-warning/15 text-warning border border-warning/30",
  danger: "bg-danger/15 text-danger border border-danger/30",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium tracking-snugg",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
