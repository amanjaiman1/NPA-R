"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "subtle" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:opacity-90 shadow-soft hover:-translate-y-px",
  ghost:
    "bg-paper/[0.04] text-paper hover:bg-paper/[0.09] border border-paper/10 hover:border-paper/20",
  outline:
    "bg-transparent text-paper border border-paper/15 hover:bg-paper/[0.05] hover:border-paper/25",
  subtle: "bg-transparent text-paper/60 hover:text-paper hover:bg-paper/[0.05]",
  danger:
    "bg-transparent text-danger hover:text-danger border border-danger/25 hover:border-danger/45 hover:bg-danger/10",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-snugg",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        "disabled:pointer-events-none disabled:opacity-40 select-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
