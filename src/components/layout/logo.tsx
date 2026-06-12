import { cn } from "@/lib/utils";

/** The Chronicle mark — a ring (the cycle of days) with a single
 *  bright node (today) sitting on the timeline. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-7 w-7", className)}
      aria-hidden
    >
      <circle
        cx="16"
        cy="16"
        r="12.5"
        className="stroke-paper/30"
        strokeWidth="1.5"
      />
      <circle
        cx="16"
        cy="16"
        r="7"
        className="stroke-paper/15"
        strokeWidth="1.5"
      />
      <line
        x1="16"
        y1="3.5"
        x2="16"
        y2="9"
        className="stroke-accent/50"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="3.5" r="2.4" className="fill-accent" />
    </svg>
  );
}
