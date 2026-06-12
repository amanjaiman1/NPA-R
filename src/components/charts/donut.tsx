"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
}

/** Floral donut chart. Segments cycle through the bloom palette. */
const BLOOM = [
  "var(--bloom-1)",
  "var(--bloom-2)",
  "var(--bloom-3)",
  "var(--bloom-4)",
  "var(--bloom-5)",
  "var(--bloom-6)",
];

export function Donut({
  segments,
  size = 160,
  thickness = 18,
  centerLabel,
  centerSub,
  className,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: React.ReactNode;
  centerSub?: React.ReactNode;
  className?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;

  const arcs = useMemo(() => {
    let offset = 0;
    return segments.map((s, i) => {
      const frac = s.value / total;
      const len = frac * c;
      const arc = {
        dasharray: `${len} ${c - len}`,
        dashoffset: -offset,
        color: BLOOM[i % BLOOM.length],
        ...s,
        pct: Math.round(frac * 100),
      };
      offset += len;
      return arc;
    });
  }, [segments, c, total]);

  return (
    <div className={cn("flex items-center gap-4 sm:gap-5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-paper/[0.06]"
            strokeWidth={thickness}
          />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={`rgb(${a.color})`}
              strokeWidth={thickness}
              strokeDasharray={a.dasharray}
              strokeDashoffset={a.dashoffset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        {(centerLabel || centerSub) && (
          <div className="absolute inset-0 grid place-items-center text-center leading-tight">
            <div>
              {centerLabel && (
                <p className="tabular text-xl font-semibold text-paper">
                  {centerLabel}
                </p>
              )}
              {centerSub && (
                <p className="text-[0.6rem] uppercase tracking-wider text-paper/40">
                  {centerSub}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {arcs.slice(0, 6).map((a, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: `rgb(${a.color})` }}
            />
            <span className="min-w-0 flex-1 truncate text-paper/70">
              {a.label}
            </span>
            <span className="tabular shrink-0 text-paper/40">{a.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
