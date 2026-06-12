"use client";

import { useMemo } from "react";
import { useMeasure } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const PAD = { top: 14, right: 14, bottom: 30, left: 38 };

export function ScatterChart({
  points,
  height = 200,
  className,
  formatX = (v: number) => `${Math.round(v * 10) / 10}`,
  formatY = (v: number) => `${Math.round(v * 10) / 10}`,
}: {
  points: { x: number; y: number }[];
  height?: number;
  className?: string;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const w = Math.max(width, 280);

  const geom = useMemo(() => {
    if (!points.length) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    if (minX === maxX) {
      minX -= 1;
      maxX += 1;
    }
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }
    const padX = (maxX - minX) * 0.08;
    const padY = (maxY - minY) * 0.12;
    minX -= padX;
    maxX += padX;
    minY -= padY;
    maxY += padY;

    const x = (v: number) =>
      PAD.left + ((v - minX) / (maxX - minX)) * (w - PAD.left - PAD.right);
    const y = (v: number) =>
      PAD.top + (1 - (v - minY) / (maxY - minY)) * (height - PAD.top - PAD.bottom);

    // least-squares regression
    const n = points.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let cov = 0;
    let varX = 0;
    for (const p of points) {
      cov += (p.x - mx) * (p.y - my);
      varX += (p.x - mx) ** 2;
    }
    const slope = varX > 0 ? cov / varX : 0;
    const intercept = my - slope * mx;
    const line =
      varX > 0
        ? {
            x1: x(minX),
            y1: y(slope * minX + intercept),
            x2: x(maxX),
            y2: y(slope * maxX + intercept),
          }
        : null;

    const ticksY = [minY, (minY + maxY) / 2, maxY];
    const ticksX = [minX, (minX + maxX) / 2, maxX];

    return { x, y, line, ticksX, ticksY };
  }, [points, w, height]);

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {!geom ? (
        <p className="py-12 text-center text-sm text-paper/40">
          Not enough data to plot.
        </p>
      ) : (
        <svg width={w} height={height}>
          {/* y ticks */}
          {geom.ticksY.map((v, i) => (
            <g key={`y${i}`}>
              <line
                x1={PAD.left}
                x2={w - PAD.right}
                y1={geom.y(v)}
                y2={geom.y(v)}
                className="stroke-paper/[0.06]"
              />
              <text
                x={PAD.left - 6}
                y={geom.y(v) + 3}
                textAnchor="end"
                className="fill-paper/35 text-[9px] tabular"
              >
                {formatY(v)}
              </text>
            </g>
          ))}
          {/* x ticks */}
          {geom.ticksX.map((v, i) => (
            <text
              key={`x${i}`}
              x={geom.x(v)}
              y={height - PAD.bottom + 14}
              textAnchor="middle"
              className="fill-paper/35 text-[9px] tabular"
            >
              {formatX(v)}
            </text>
          ))}
          {/* regression line */}
          {geom.line && (
            <line
              x1={geom.line.x1}
              y1={geom.line.y1}
              x2={geom.line.x2}
              y2={geom.line.y2}
              className="stroke-paper/55"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
          )}
          {/* points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={geom.x(p.x)}
              cy={geom.y(p.y)}
              r={3}
              className="fill-paper/70"
            />
          ))}
        </svg>
      )}
    </div>
  );
}
