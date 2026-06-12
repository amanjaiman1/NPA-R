import * as React from "react";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils";

/** Slim linear progress bar. */
export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
}) {
  const v = clamp(value, 0, 100);
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-paper/10",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-accent transition-all duration-700 ease-out",
          barClassName,
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

/** Circular progress ring rendered in pure SVG (grayscale). */
export function RadialProgress({
  value,
  size = 64,
  stroke = 6,
  label,
  sublabel,
  className,
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  className?: string;
}) {
  const v = clamp(value, 0, 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-paper/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-accent transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 grid place-items-center text-center leading-none">
          {label && (
            <span className="tabular text-sm font-semibold text-paper">
              {label}
            </span>
          )}
          {sublabel && (
            <span className="mt-0.5 text-[0.6rem] text-paper/45">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
