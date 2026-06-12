"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  sublabel?: string;
}

/** Horizontal-friendly vertical bar chart using flex (crisp at any size). */
export function BarChart({
  data,
  height = 180,
  className,
  formatValue = (v) => String(v),
  target,
}: {
  data: BarDatum[];
  height?: number;
  className?: string;
  formatValue?: (v: number) => string;
  target?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), target ?? 0, 1);

  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative flex items-end justify-between gap-1.5"
        style={{ height }}
      >
        {target !== undefined && (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-paper/25"
            style={{ bottom: `${(target / max) * 100}%` }}
          >
            <span className="absolute -top-4 right-0 text-[0.6rem] text-paper/40">
              goal {formatValue(target)}
            </span>
          </div>
        )}
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const isLast = i === data.length - 1;
          return (
            <div
              key={i}
              className="group relative flex h-full flex-1 flex-col justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className={cn(
                  "w-full rounded-t-[4px] transition-all duration-300",
                  isLast ? "bg-accent" : "bg-paper/25 group-hover:bg-paper/45",
                  hover === i && !isLast && "bg-paper/55",
                )}
                style={{ height: `${Math.max(pct, 1.5)}%` }}
              />
              {hover === i && (
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-paper/15 bg-ink px-2 py-1 text-center shadow-glow">
                  <p className="tabular text-xs font-semibold text-paper">
                    {formatValue(d.value)}
                  </p>
                  {d.sublabel && (
                    <p className="text-[0.6rem] text-paper/50">{d.sublabel}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-1.5">
        {data.map((d, i) => (
          <span
            key={i}
            className="flex-1 truncate text-center text-[0.6rem] text-paper/35"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
