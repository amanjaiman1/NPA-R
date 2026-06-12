"use client";

import { useMemo, useState } from "react";
import type { HeatCell } from "@/lib/selectors";
import { fromISODate, formatDate, formatHours } from "@/lib/utils";
import { cn } from "@/lib/utils";

const LEVEL_BG = [
  "bg-paper/[0.05]",
  "bg-accent/25",
  "bg-accent/45",
  "bg-accent/65",
  "bg-accent/90",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Heatmap({
  cells,
  className,
  cellSize = 12,
  gap = 3,
  formatTooltip,
  legendLow = "Less",
  legendHigh = "More",
}: {
  cells: HeatCell[];
  className?: string;
  cellSize?: number;
  gap?: number;
  formatTooltip?: (cell: HeatCell) => { primary: string; secondary: string };
  legendLow?: string;
  legendHigh?: string;
}) {
  const [hover, setHover] = useState<{
    cell: HeatCell;
    x: number;
    y: number;
  } | null>(null);

  // Build week columns. Pad the start so the first column begins on Sunday.
  const { weeks, monthLabels } = useMemo(() => {
    if (!cells.length) return { weeks: [] as (HeatCell | null)[][], monthLabels: [] as { col: number; label: string }[] };
    const padded: (HeatCell | null)[] = [];
    const firstDow = fromISODate(cells[0].date).getDay();
    for (let i = 0; i < firstDow; i++) padded.push(null);
    padded.push(...cells);
    const weeks: (HeatCell | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const first = week.find((c) => c);
      if (!first) return;
      const m = fromISODate(first.date).getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ col, label: MONTHS[m] });
        lastMonth = m;
      }
    });
    return { weeks, monthLabels };
  }, [cells]);

  const colWidth = cellSize + gap;

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="inline-block">
          {/* Month labels */}
          <div
            className="relative mb-1.5 h-3"
            style={{ marginLeft: cellSize + gap + 4 }}
          >
            {monthLabels.map((m) => (
              <span
                key={`${m.col}-${m.label}`}
                className="absolute text-[0.6rem] text-paper/35"
                style={{ left: m.col * colWidth }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Weekday labels */}
            <div
              className="mr-1 flex flex-col"
              style={{ gap }}
            >
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <span
                  key={i}
                  className="text-[0.55rem] leading-none text-paper/30"
                  style={{ height: cellSize, lineHeight: `${cellSize}px` }}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, ci) => (
              <div key={ci} className="flex flex-col" style={{ gap }}>
                {week.map((cell, ri) =>
                  cell ? (
                    <div
                      key={cell.date}
                      onMouseEnter={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setHover({ cell, x: r.left + r.width / 2, y: r.top });
                      }}
                      onMouseLeave={() => setHover(null)}
                      className={cn(
                        "rounded-[3px] transition-colors duration-150 hover:ring-1 hover:ring-accent/50",
                        LEVEL_BG[cell.level],
                      )}
                      style={{ width: cellSize, height: cellSize }}
                    />
                  ) : (
                    <div
                      key={`empty-${ci}-${ri}`}
                      style={{ width: cellSize, height: cellSize }}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-1.5 text-[0.6rem] text-paper/40">
        <span>{legendLow}</span>
        {LEVEL_BG.map((bg, i) => (
          <span
            key={i}
            className={cn("h-2.5 w-2.5 rounded-[3px]", bg)}
          />
        ))}
        <span>{legendHigh}</span>
      </div>

      {/* Tooltip */}
      {hover && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-paper/15 bg-ink px-2.5 py-1.5 text-center shadow-glow"
          style={{ left: hover.x, top: hover.y - 8 }}
        >
          <p className="tabular text-xs font-semibold text-paper">
            {formatTooltip
              ? formatTooltip(hover.cell).primary
              : hover.cell.hours > 0
                ? formatHours(hover.cell.hours)
                : "Rest day"}
          </p>
          <p className="whitespace-nowrap text-[0.6rem] text-paper/50">
            {formatTooltip
              ? formatTooltip(hover.cell).secondary
              : formatDate(hover.cell.date)}
          </p>
        </div>
      )}
    </div>
  );
}
