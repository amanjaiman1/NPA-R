"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useChronicle, useHasHydrated } from "@/lib/store";
import type { MockTest } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Loading } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented, EmptyState } from "@/components/ui/misc";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { CandleChart } from "@/components/mocks/candle-chart";
import { MockComposer } from "@/components/mocks/composer";
import {
  mockPoints,
  movingAverage,
  candles,
  summarize,
  subjectAccuracy,
  explainTrend,
  recommendations,
} from "@/lib/mock-analytics";
import { formatDate, toISODate, uid, cn } from "@/lib/utils";

type Filter = "Prelims GS" | "Prelims CSAT" | "Mains" | "Sectional" | "all";
const TABS: { label: string; value: Filter }[] = [
  { label: "Prelims GS", value: "Prelims GS" },
  { label: "CSAT", value: "Prelims CSAT" },
  { label: "Mains", value: "Mains" },
  { label: "Sectional", value: "Sectional" },
  { label: "All", value: "all" },
];

function emptyMock(): MockTest {
  return {
    id: uid("m"),
    date: toISODate(new Date()),
    name: "",
    type: "Prelims GS",
    provider: "",
    score: 0,
    max: 200,
    sections: [],
  };
}

function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  return (
    <span className="inline-flex items-center gap-0.5 text-[0.7rem] text-paper/55">
      <Icon className="h-3 w-3" />
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function Ticker({
  label,
  value,
  foot,
}: {
  label: string;
  value: React.ReactNode;
  foot?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3.5">
      <p className="font-mono text-[0.58rem] uppercase tracking-[0.15em] text-paper/40">
        {label}
      </p>
      <p className="tabular mt-1 text-xl font-semibold leading-none text-paper">
        {value}
      </p>
      {foot && <div className="mt-1.5 leading-none">{foot}</div>}
    </div>
  );
}

export default function MocksPage() {
  const hydrated = useHasHydrated();
  const mocks = useChronicle((s) => s.mocks);
  const profile = useChronicle((s) => s.profile);
  const remove = useChronicle((s) => s.deleteMock);

  const [filter, setFilter] = useState<Filter>("Prelims GS");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MockTest>(emptyMock());

  const filtered = useMemo(() => {
    const match = (m: MockTest) =>
      filter === "all"
        ? true
        : filter === "Mains"
          ? m.type.startsWith("Mains")
          : m.type === filter;
    return mocks.filter(match);
  }, [mocks, filter]);

  const analytics = useMemo(() => {
    const pts = mockPoints(filtered);
    const cnd = candles(filtered);
    const ma = movingAverage(cnd.map((c) => c.close), 5);
    return {
      pts,
      cnd,
      ma,
      summary: summarize(filtered),
      subjects: subjectAccuracy(filtered),
      trend: explainTrend(filtered),
      recs: recommendations(filtered),
    };
  }, [filtered]);

  const { pts, cnd, ma, summary, subjects, trend, recs } = analytics;
  const hasAccuracy = pts.some((p) => p.accuracy != null);
  const hasNegatives = pts.some((p) => p.negative > 0);

  if (!hydrated) return <Loading />;

  const tableRows = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Mock Analytics · ${profile.name}'s performance terminal`}
        title="The scoreboard, decoded."
        description="Every mock, broken down like a trading terminal — score & accuracy trends, negative-marking cost, time per section, and an engine that tells you why the marks are moving."
        actions={
          <Button
            onClick={() => {
              setDraft(emptyMock());
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Log mock
          </Button>
        }
      />

      <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
        <Segmented value={filter} onChange={(v) => setFilter(v as Filter)} options={TABS} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-5 w-5" />}
          title="No mocks in this category"
          description="Log a mock with section-wise detail to power the analytics terminal."
          action={
            <Button
              onClick={() => {
                setDraft(emptyMock());
                setOpen(true);
              }}
            >
              Log your first mock
            </Button>
          }
        />
      ) : (
        <>
          {/* Ticker strip */}
          <Card className="grid grid-cols-2 divide-x divide-y divide-paper/[0.06] sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
            <Ticker
              label="Latest"
              value={summary.latest ? `${summary.latest.score}` : "—"}
              foot={
                summary.latest ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.7rem] text-paper/45">
                      /{summary.latest.max}
                    </span>
                    <Delta value={summary.delta} />
                  </div>
                ) : null
              }
            />
            <Ticker label="Avg %" value={`${summary.average}%`} foot={<span className="font-mono text-[0.7rem] text-paper/40">{summary.count} mocks</span>} />
            <Ticker
              label="Best"
              value={summary.best ? `${summary.best.pct}%` : "—"}
              foot={summary.best ? <span className="font-mono text-[0.7rem] text-paper/40">{summary.best.score}/{summary.best.max}</span> : null}
            />
            <Ticker
              label="Accuracy"
              value={summary.accuracyAvg != null ? `${summary.accuracyAvg}%` : "—"}
              foot={<span className="font-mono text-[0.7rem] text-paper/40">of attempted</span>}
            />
            <Ticker
              label="Neg / mock"
              value={summary.negativeAvg != null ? `−${summary.negativeAvg}` : "—"}
              foot={<span className="font-mono text-[0.7rem] text-paper/40">marks lost</span>}
            />
            <Ticker
              label="Projected"
              value={summary.projectedScore != null ? `${summary.projectedScore}` : "—"}
              foot={<span className="font-mono text-[0.7rem] text-paper/40">recent form</span>}
            />
          </Card>

          {/* Main terminal */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="font-mono text-sm font-semibold tracking-wider text-paper">
                  SCORE
                </h3>
                <span className="font-mono text-xs text-paper/40">
                  {"// "}
                  {filter === "all" ? "ALL MOCKS" : filter.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[0.6rem] text-paper/40">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2 rounded-[1px] bg-paper" /> up
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2 rounded-[1px] border border-paper/70" /> down
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-[1px] w-3 bg-paper/55" /> MA-5
                </span>
              </div>
            </div>
            {cnd.length > 1 ? (
              <CandleChart candles={cnd} ma={ma} height={320} />
            ) : (
              <p className="py-16 text-center text-sm text-paper/40">
                Log at least two mocks to render the terminal.
              </p>
            )}
          </Card>

          {/* Accuracy + negatives */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <p className="eyebrow mb-1">{hasAccuracy ? "Accuracy" : "Score %"} trend</p>
              <h3 className="mb-5 text-base font-semibold text-paper">
                {hasAccuracy ? "Correct per attempt" : "Percentage over time"}
              </h3>
              {pts.length > 1 ? (
                <LineChart
                  data={pts.map((p) => ({
                    label: p.label,
                    value: hasAccuracy ? (p.accuracy ?? p.pct) : p.pct,
                    meta: `${p.name} · ${hasAccuracy && p.accuracy != null ? `${p.accuracy}% acc` : `${p.pct}%`}`,
                  }))}
                  formatValue={(v) => `${v}%`}
                  height={200}
                />
              ) : (
                <p className="py-12 text-center text-sm text-paper/40">Need more data.</p>
              )}
            </Card>

            <Card className="p-5">
              <p className="eyebrow mb-1">{hasNegatives ? "Negative marking" : "Time taken"}</p>
              <h3 className="mb-5 text-base font-semibold text-paper">
                {hasNegatives ? "Marks lost per mock" : "Minutes per mock"}
              </h3>
              <BarChart
                data={pts.map((p) => ({
                  label: p.label,
                  value: hasNegatives ? p.negative : p.timeTaken,
                  sublabel: p.name,
                }))}
                formatValue={(v) => (hasNegatives ? `−${v}` : `${v}m`)}
                height={200}
              />
            </Card>
          </div>

          {/* Why marks are moving */}
          {trend && (
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    trend.direction === "down"
                      ? "bg-paper/10 text-paper"
                      : "bg-paper text-ink",
                  )}
                >
                  {trend.direction === "up" ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : trend.direction === "down" ? (
                    <TrendingDown className="h-5 w-5" />
                  ) : (
                    <Minus className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-paper">
                      Why your marks are moving
                    </h3>
                    <Badge tone="outline">
                      {trend.priorAvg}% → {trend.recentAvg}%
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-paper/60">{trend.headline}</p>
                </div>
              </div>

              {trend.drivers.length > 0 && (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {trend.drivers.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-paper/[0.08] bg-paper/[0.02] p-3"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md",
                          d.kind === "positive"
                            ? "bg-paper/15 text-paper"
                            : "border border-paper/20 text-paper/60",
                        )}
                      >
                        {d.kind === "positive" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-paper">{d.label}</p>
                        <p className="text-xs text-paper/50">{d.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Subject accuracy + AI recommendations */}
          <div className="grid gap-4 lg:grid-cols-2">
            {subjects.length > 0 && (
              <Card className="p-5">
                <p className="eyebrow mb-1">Subject-wise accuracy</p>
                <h3 className="mb-4 text-base font-semibold text-paper">
                  Strengths &amp; weaknesses
                </h3>
                <ul className="space-y-2.5">
                  {subjects.map((s) => (
                    <li key={s.name} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-sm text-paper/70">
                        {s.name}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper/[0.07]">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            s.accuracy >= 65
                              ? "bg-paper"
                              : s.accuracy >= 50
                                ? "bg-paper/55"
                                : "bg-paper/30",
                          )}
                          style={{ width: `${s.accuracy}%` }}
                        />
                      </div>
                      <span className="tabular w-9 shrink-0 text-right text-xs text-paper/55">
                        {s.accuracy}%
                      </span>
                      <span className="hidden w-16 shrink-0 text-right font-mono text-[0.6rem] text-paper/30 sm:block">
                        {s.avgTime}m avg
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-paper text-ink">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="text-base font-semibold text-paper">AI recommendations</h3>
              </div>
              {recs.length === 0 ? (
                <p className="text-sm text-paper/45">
                  Log a few section-wise mocks to unlock tailored guidance.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {recs.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-paper/[0.08] p-3"
                    >
                      <span
                        className={cn(
                          "mt-0.5 rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider",
                          r.priority === "high"
                            ? "bg-paper text-ink"
                            : r.priority === "medium"
                              ? "bg-paper/15 text-paper"
                              : "border border-paper/20 text-paper/55",
                        )}
                      >
                        {r.priority}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-paper">{r.title}</p>
                        <p className="text-xs leading-relaxed text-paper/55">{r.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Time allocation */}
          {subjects.some((s) => s.avgTime > 0) && (
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-paper/45" />
                <h3 className="text-base font-semibold text-paper">
                  Time vs accuracy by section
                </h3>
              </div>
              <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {[...subjects]
                  .filter((s) => s.avgTime > 0)
                  .sort((a, b) => b.avgTime - a.avgTime)
                  .map((s) => {
                    const maxTime = Math.max(...subjects.map((x) => x.avgTime), 1);
                    return (
                      <div key={s.name} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate text-sm text-paper/70">
                          {s.name}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper/[0.07]">
                          <div
                            className="h-full rounded-full bg-paper/45"
                            style={{ width: `${(s.avgTime / maxTime) * 100}%` }}
                          />
                        </div>
                        <span className="tabular w-12 shrink-0 text-right font-mono text-[0.65rem] text-paper/55">
                          {s.avgTime}m
                        </span>
                        <span
                          className={cn(
                            "tabular w-9 shrink-0 text-right text-xs",
                            s.accuracy < 55 ? "text-paper/40" : "text-paper/70",
                          )}
                        >
                          {s.accuracy}%
                        </span>
                      </div>
                    );
                  })}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-paper/35">
                <AlertTriangle className="h-3 w-3" />
                Long bars with low accuracy are your time sinks — cap them.
              </p>
            </Card>
          )}

          {/* Log table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-paper/[0.08] text-left font-mono text-[0.65rem] uppercase tracking-wider text-paper/40">
                    <th className="px-5 py-3 font-medium">Test</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 text-right font-medium">Score</th>
                    <th className="px-5 py-3 text-right font-medium">Acc</th>
                    <th className="px-5 py-3 text-right font-medium">Neg</th>
                    <th className="px-5 py-3 text-right font-medium">%</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((m) => {
                    const pct = Math.round((m.score / m.max) * 100);
                    const acc =
                      m.attempted && m.attempted > 0
                        ? Math.round(((m.correct ?? 0) / m.attempted) * 100)
                        : null;
                    return (
                      <tr
                        key={m.id}
                        className="group border-b border-paper/[0.05] last:border-0 transition-colors hover:bg-paper/[0.02]"
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-paper">{m.name}</p>
                          <p className="text-xs text-paper/40">
                            {m.provider ? `${m.provider} · ` : ""}
                            {m.type}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-paper/50">{formatDate(m.date)}</td>
                        <td className="tabular px-5 py-3 text-right text-paper/80">
                          {m.score}/{m.max}
                        </td>
                        <td className="tabular px-5 py-3 text-right text-paper/60">
                          {acc != null ? `${acc}%` : "—"}
                        </td>
                        <td className="tabular px-5 py-3 text-right text-paper/60">
                          {m.negative != null ? `−${m.negative}` : "—"}
                        </td>
                        <td className="tabular px-5 py-3 text-right font-semibold text-paper">
                          {pct}%
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => remove(m.id)}
                            className="text-paper/25 opacity-0 transition-opacity hover:text-paper group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <MockComposer open={open} onClose={() => setOpen(false)} initial={draft} />
    </div>
  );
}
