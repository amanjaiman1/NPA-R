"use client";

import { useMemo, useState } from "react";
import { useMeasure } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Candle } from "@/lib/mock-analytics";

const PAD = { top: 16, right: 44, bottom: 20, left: 10 };
const VOL_H = 34;

export function CandleChart({
  candles,
  ma,
  height = 320,
  className,
  formatValue = (v: number) => `${Math.round(v)}%`,
}: {
  candles: Candle[];
  ma?: (number | null)[];
  height?: number;
  className?: string;
  formatValue?: (v: number) => string;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const w = Math.max(width, 320);

  const geom = useMemo(() => {
    const priceBottom = height - VOL_H - PAD.bottom;
    const priceTop = PAD.top;
    const innerW = w - PAD.left - PAD.right;
    const n = candles.length;
    const step = n > 0 ? innerW / n : innerW;
    const cw = Math.min(step * 0.62, 16);

    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const maxV = Math.max(...highs, ...(ma?.filter((x): x is number => x != null) ?? []), 1);
    const minV = Math.min(...lows, 0);
    const pad = (maxV - minV) * 0.08 || 5;
    const top = maxV + pad;
    const bot = Math.max(0, minV - pad);

    const x = (i: number) => PAD.left + (i + 0.5) * step;
    const yPrice = (v: number) =>
      priceTop + (priceBottom - priceTop) * (1 - (v - bot) / (top - bot || 1));

    const maxVol = Math.max(...candles.map((c) => c.volume), 1);
    const volTop = priceBottom + 8;
    const yVol = (v: number) => volTop + (height - PAD.bottom - volTop) * (1 - v / maxVol);

    const grid = Array.from({ length: 4 }).map((_, i) => {
      const v = bot + ((top - bot) / 3) * i;
      return { v, y: yPrice(v) };
    });

    const maPath = ma
      ? ma
          .map((v, i) =>
            v == null ? null : `${x(i).toFixed(1)},${yPrice(v).toFixed(1)}`,
          )
          .filter(Boolean)
          .reduce((acc, pt, idx) => acc + (idx === 0 ? `M${pt}` : ` L${pt}`), "")
      : "";

    return { x, yPrice, yVol, step, cw, grid, priceBottom, volTop, maPath };
  }, [candles, ma, w, height]);

  function onMove(e: React.MouseEvent) {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const lx = e.clientX - r.left;
    const i = Math.round((lx - PAD.left) / geom.step - 0.5);
    setHover(Math.max(0, Math.min(candles.length - 1, i)));
  }

  const hc = hover != null ? candles[hover] : null;

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <svg
        width={w}
        height={height}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="block"
      >
        {/* gridlines + right axis */}
        {geom.grid.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={w - PAD.right}
              y1={g.y}
              y2={g.y}
              className="stroke-paper/[0.06]"
              strokeWidth={1}
            />
            <text
              x={w - PAD.right + 6}
              y={g.y + 3}
              className="fill-paper/35 text-[9px] tabular"
            >
              {formatValue(g.v)}
            </text>
          </g>
        ))}

        {/* moving average */}
        {geom.maPath && (
          <path
            d={geom.maPath}
            fill="none"
            className="stroke-paper/55"
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
        )}

        {/* candles */}
        {candles.map((c, i) => {
          const cx = geom.x(i);
          const yHigh = geom.yPrice(c.high);
          const yLow = geom.yPrice(c.low);
          const yOpen = geom.yPrice(c.open);
          const yClose = geom.yPrice(c.close);
          const top = Math.min(yOpen, yClose);
          const h = Math.max(Math.abs(yClose - yOpen), 1.5);
          const active = hover === i;
          return (
            <g key={c.date} opacity={hover != null && !active ? 0.55 : 1}>
              <line
                x1={cx}
                x2={cx}
                y1={yHigh}
                y2={yLow}
                className="stroke-paper/45"
                strokeWidth={1}
              />
              <rect
                x={cx - geom.cw / 2}
                y={top}
                width={geom.cw}
                height={h}
                rx={1}
                className={cn(
                  c.up ? "fill-paper" : "fill-ink stroke-paper/80",
                )}
                fillOpacity={c.up ? 0.92 : 1}
                strokeWidth={c.up ? 0 : 1.3}
              />
              {/* volume */}
              <rect
                x={cx - geom.cw / 2}
                y={geom.yVol(c.volume)}
                width={geom.cw}
                height={Math.max(height - PAD.bottom - geom.yVol(c.volume), 0)}
                className="fill-paper"
                fillOpacity={active ? 0.4 : 0.16}
              />
            </g>
          );
        })}

        {/* crosshair */}
        {hc && (
          <line
            x1={geom.x(hover!)}
            x2={geom.x(hover!)}
            y1={PAD.top}
            y2={geom.priceBottom}
            className="stroke-paper/30"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {/* volume label */}
        <text
          x={PAD.left}
          y={geom.volTop + 4}
          className="fill-paper/30 text-[8px] uppercase tracking-wider"
        >
          VOL
        </text>
      </svg>

      {/* readout */}
      {hc && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-paper/12 bg-ink/85 px-3 py-2 font-mono text-[0.65rem] leading-relaxed text-paper/70 backdrop-blur">
          <div className="mb-0.5 text-paper/90">{hc.name}</div>
          <div className="flex gap-3">
            <span>O {Math.round(hc.open)}</span>
            <span>H {Math.round(hc.high)}</span>
            <span>L {Math.round(hc.low)}</span>
            <span className="text-paper">C {Math.round(hc.close)}</span>
          </div>
          <div className="mt-0.5 flex gap-3 text-paper/50">
            <span>{hc.score}/{hc.max}</span>
            {hc.accuracy != null && <span>acc {hc.accuracy}%</span>}
            <span>{hc.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
