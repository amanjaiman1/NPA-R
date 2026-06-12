"use client";

import { useMemo, useState } from "react";
import { useMeasure } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export interface LinePoint {
  label: string;
  value: number;
  meta?: string;
}

const pad = { top: 16, right: 12, bottom: 26, left: 34 };

export function LineChart({
  data,
  height = 220,
  className,
  formatValue = (v) => String(v),
  showArea = true,
  showDots = true,
  target,
}: {
  data: LinePoint[];
  height?: number;
  className?: string;
  formatValue?: (v: number) => string;
  showArea?: boolean;
  showDots?: boolean;
  target?: number;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const w = Math.max(width, 280);
  const h = height;

  const { min, max, points, areaPath, linePath, gridY } = useMemo(() => {
    const values = data.map((d) => d.value);
    const rawMax = Math.max(...values, target ?? 0, 1);
    const rawMin = Math.min(...values, 0);
    const max = Math.ceil(rawMax * 1.1);
    const min = Math.floor(rawMin);
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;
    const x = (i: number) =>
      pad.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = (v: number) =>
      pad.top + innerH - ((v - min) / (max - min || 1)) * innerH;
    const points = data.map((d, i) => ({ x: x(i), y: y(d.value), d }));
    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
    const areaPath =
      points.length > 0
        ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${(h - pad.bottom).toFixed(1)} L${points[0].x.toFixed(1)},${(h - pad.bottom).toFixed(1)} Z`
        : "";
    const gridY = Array.from({ length: 4 }).map((_, i) => {
      const v = min + ((max - min) / 3) * i;
      return { v, y: y(v) };
    });
    return { min, max, points, areaPath, linePath, gridY };
  }, [data, w, h, target]);

  const gid = useMemo(() => `lg-${Math.random().toString(36).slice(2, 7)}`, []);

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <svg width={w} height={h} className="overflow-visible">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.20" />
            <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines */}
        {gridY.map((g, i) => (
          <g key={i}>
            <line
              x1={pad.left}
              x2={w - pad.right}
              y1={g.y}
              y2={g.y}
              className="stroke-paper/[0.06]"
              strokeWidth={1}
            />
            <text
              x={pad.left - 8}
              y={g.y + 3}
              textAnchor="end"
              className="fill-paper/30 text-[9px] tabular"
            >
              {formatValue(Math.round(g.v))}
            </text>
          </g>
        ))}

        {/* target line */}
        {target !== undefined && (
          <line
            x1={pad.left}
            x2={w - pad.right}
            y1={pad.top + (h - pad.top - pad.bottom) - ((target - min) / (max - min || 1)) * (h - pad.top - pad.bottom)}
            y2={pad.top + (h - pad.top - pad.bottom) - ((target - min) / (max - min || 1)) * (h - pad.top - pad.bottom)}
            className="stroke-paper/40"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}

        {showArea && areaPath && <path d={areaPath} fill={`url(#${gid})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            className="stroke-accent"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {showDots &&
          points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hover === i ? 4 : 2.5}
                className={cn("fill-ink stroke-accent transition-all", hover === i && "fill-accent")}
                strokeWidth={1.5}
              />
              {/* hover hit area */}
              <rect
                x={p.x - (w / data.length) / 2}
                y={0}
                width={w / data.length}
                height={h}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          ))}
      </svg>

      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-paper/15 bg-ink px-2.5 py-1.5 text-center shadow-glow"
          style={{ left: points[hover].x, top: points[hover].y - 10 }}
        >
          <p className="tabular text-xs font-semibold text-paper">
            {formatValue(points[hover].d.value)}
          </p>
          <p className="whitespace-nowrap text-[0.6rem] text-paper/50">
            {points[hover].d.meta ?? points[hover].d.label}
          </p>
        </div>
      )}
    </div>
  );
}
