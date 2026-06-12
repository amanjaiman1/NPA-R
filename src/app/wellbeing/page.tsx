"use client";

import { useMemo, useState } from "react";
import {
  Moon,
  BrainCircuit,
  Droplets,
  Wind,
  Activity,
  Footprints,
  Smartphone,
  Scale,
  Plus,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  GitCompareArrows,
} from "lucide-react";
import { useChronicle, useHasHydrated } from "@/lib/store";
import type { LifeEntry, ExerciseType } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Loading } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, RatingPicker } from "@/components/ui/form";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { ScatterChart } from "@/components/charts/scatter";
import { MatrixHeatmap } from "@/components/charts/matrix";
import {
  LIFE_TARGETS,
  todayEntry,
  weeklyReport,
  factorImpact,
  correlationReports,
  correlationMatrix,
  weekTotals,
  strengthLabel,
} from "@/lib/life";
import { toISODate, formatDate, weekday, round, cn } from "@/lib/utils";

const EX_TYPES: ExerciseType[] = ["Run", "Walk", "Gym", "Yoga", "Cycling", "Sports", "Other"];

function emptyLifeEntry(date: string): LifeEntry {
  return {
    id: `life-${date}`,
    date,
    sleepHours: 7,
    sleepQuality: 3,
    bedtime: "23:00",
    wakeTime: "06:00",
    walkKm: 0,
    runKm: 0,
    exerciseMinutes: 0,
    waterLiters: 2,
    meditationMin: 0,
    screenTimeMin: 120,
    deepWorkHours: 0,
  };
}

export default function LifeDashboardPage() {
  const hydrated = useHasHydrated();
  const lifeLog = useChronicle((s) => s.lifeLog);
  const journal = useChronicle((s) => s.journal);
  const mocks = useChronicle((s) => s.mocks);
  const upsert = useChronicle((s) => s.upsertLifeEntry);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LifeEntry>(emptyLifeEntry(toISODate(new Date())));

  const today = toISODate(new Date());
  const te = useMemo(() => todayEntry(lifeLog, today), [lifeLog, today]);
  const week = useMemo(() => weeklyReport(lifeLog, today), [lifeLog, today]);
  const totals = useMemo(() => weekTotals(lifeLog, today), [lifeLog, today]);
  const factors = useMemo(() => factorImpact(lifeLog, journal), [lifeLog, journal]);
  const reports = useMemo(
    () => correlationReports(lifeLog, journal, mocks, today),
    [lifeLog, journal, mocks, today],
  );
  const matrix = useMemo(
    () => correlationMatrix(lifeLog, journal),
    [lifeLog, journal],
  );

  const trend = useMemo(() => {
    const map = new Map(lifeLog.map((e) => [e.date, e]));
    const sleep: { label: string; value: number; sublabel: string }[] = [];
    const deep: { label: string; value: number; meta: string }[] = [];
    const screen: { label: string; value: number; meta: string }[] = [];
    for (let i = 20; i >= 0; i--) {
      const iso = toISODate(new Date(Date.now() - i * 86400000));
      const e = map.get(iso);
      const lbl = weekday(iso).slice(0, 1);
      sleep.push({ label: lbl, value: e ? e.sleepHours : 0, sublabel: formatDate(iso) });
      deep.push({ label: lbl, value: e ? e.deepWorkHours : 0, meta: formatDate(iso) });
      screen.push({ label: lbl, value: e ? e.screenTimeMin : 0, meta: formatDate(iso) });
    }
    return { sleep, deep, screen };
  }, [lifeLog]);

  function openComposer() {
    setDraft(te ? { ...te } : emptyLifeEntry(today));
    setOpen(true);
  }
  function save() {
    upsert(draft);
    setOpen(false);
  }

  if (!hydrated) return <Loading />;

  const tiles = te
    ? [
        { icon: Moon, label: "Sleep", value: te.sleepHours, unit: "h", target: LIFE_TARGETS.sleepHours, lowerBetter: false },
        { icon: BrainCircuit, label: "Deep work", value: te.deepWorkHours, unit: "h", target: LIFE_TARGETS.deepWorkHours, lowerBetter: false },
        { icon: Droplets, label: "Water", value: te.waterLiters, unit: "L", target: LIFE_TARGETS.waterLiters, lowerBetter: false },
        { icon: Wind, label: "Meditation", value: te.meditationMin, unit: "m", target: LIFE_TARGETS.meditationMin, lowerBetter: false },
        { icon: Activity, label: "Exercise", value: te.exerciseMinutes, unit: "m", target: LIFE_TARGETS.exerciseMinutes, lowerBetter: false },
        { icon: Footprints, label: "Walk", value: te.walkKm, unit: "km", target: LIFE_TARGETS.walkKm, lowerBetter: false },
        { icon: Smartphone, label: "Screen", value: te.screenTimeMin, unit: "m", target: LIFE_TARGETS.screenTimeMin, lowerBetter: true },
        { icon: Scale, label: "Weight", value: te.weightKg ?? 0, unit: "kg", target: 0, lowerBetter: false },
      ]
    : [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Life Dashboard"
        title="The body carries the mind."
        description="Sleep, movement, water, screen time and focus aren't separate from prep — they're its foundation. Track the inputs, then let the correlation engine reveal which lifestyle factors actually move your performance."
        actions={
          <Button onClick={openComposer}>
            <Plus className="h-4 w-4" /> Log today
          </Button>
        }
      />

      {/* Daily snapshot */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-snugg text-paper">
          Today · {formatDate(today)}
        </h2>
        {!te ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm font-medium text-paper">No entry for today yet</p>
            <Button className="mt-4" onClick={openComposer}>
              Log today’s metrics
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((t) => {
              const pct =
                t.target > 0 ? Math.min(100, (t.value / t.target) * 100) : 0;
              const hit = t.lowerBetter ? t.value <= t.target : t.value >= t.target;
              return (
                <Card key={t.label} className="p-4">
                  <div className="flex items-center gap-2 text-paper/40">
                    <t.icon className="h-4 w-4" />
                    <span className="text-[0.62rem] font-medium uppercase tracking-wider">
                      {t.label}
                    </span>
                  </div>
                  <p className="tabular mt-2 text-2xl font-semibold text-paper">
                    {round(t.value, 1)}
                    <span className="ml-1 text-sm font-normal text-paper/40">
                      {t.unit}
                    </span>
                  </p>
                  {t.target > 0 ? (
                    <>
                      <Progress
                        value={pct}
                        className="mt-2"
                        barClassName={hit ? "bg-paper" : "bg-paper/50"}
                      />
                      <p className="mt-1 text-[0.62rem] text-paper/35">
                        {t.lowerBetter ? "limit" : "goal"} {t.target}
                        {t.unit}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-[0.62rem] text-paper/35">tracked daily</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Weekly analytics */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-snugg text-paper">
            This week vs last
          </h2>
          <span className="text-xs text-paper/40">
            {totals.exerciseDays} active days · {totals.runKm}km run
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {week.map((m) => {
            const up = m.delta != null && m.delta > 0;
            const down = m.delta != null && m.delta < 0;
            const good = m.delta == null || m.delta === 0 ? null : (up === m.goodWhenUp);
            const Icon = up ? ArrowUp : down ? ArrowDown : Minus;
            return (
              <Card key={m.key} className="p-4">
                <p className="text-[0.62rem] font-medium uppercase tracking-wider text-paper/40">
                  {m.label}
                </p>
                <p className="tabular mt-1.5 text-xl font-semibold text-paper">
                  {m.thisWeek ?? "—"}
                  <span className="ml-0.5 text-xs font-normal text-paper/40">
                    {m.unit}
                  </span>
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[0.7rem]",
                      good === null
                        ? "text-paper/40"
                        : good
                          ? "text-paper"
                          : "text-paper/45",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {m.delta != null ? `${m.delta > 0 ? "+" : ""}${m.delta}` : "—"}
                  </span>
                  <Sparkline values={m.spark} width={56} height={20} fill={false} />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <p className="eyebrow mb-4">Sleep · 21 days</p>
            <BarChart data={trend.sleep} target={LIFE_TARGETS.sleepHours} formatValue={(v) => `${v}h`} height={150} />
          </Card>
          <Card className="p-5">
            <p className="eyebrow mb-4">Deep work · 21 days</p>
            <LineChart data={trend.deep} target={LIFE_TARGETS.deepWorkHours} formatValue={(v) => `${v}h`} height={150} showDots={false} />
          </Card>
          <Card className="p-5">
            <p className="eyebrow mb-4">Screen time · 21 days</p>
            <LineChart data={trend.screen} formatValue={(v) => `${v}m`} height={150} />
          </Card>
        </div>
      </section>

      {/* Correlation: lifestyle factors */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-4 w-4 text-paper/45" />
          <h2 className="text-sm font-semibold tracking-snugg text-paper">
            Lifestyle factors affecting your study
          </h2>
        </div>
        <Card className="p-5">
          <p className="mb-4 text-xs text-paper/45">
            Correlation of each lifestyle metric with daily study hours (your
            performance proxy). Longer bar = stronger influence.
          </p>
          {factors.length === 0 ? (
            <p className="py-6 text-center text-sm text-paper/40">
              Log a couple of weeks to compute reliable correlations.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {factors.map((f) => (
                <li key={f.key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-paper/70">
                    {f.label}
                  </span>
                  <div className="relative h-2 flex-1 rounded-full bg-paper/[0.07]">
                    <div
                      className={cn(
                        "absolute top-0 h-full rounded-full",
                        f.direction === "helps" ? "left-1/2 bg-paper" : "right-1/2 bg-paper/40",
                      )}
                      style={{ width: `${Math.min(50, Math.abs(f.r) * 50)}%` }}
                    />
                    <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-paper/20" />
                  </div>
                  <span className="tabular w-12 shrink-0 text-right text-xs text-paper/55">
                    {f.r > 0 ? "+" : ""}
                    {f.r}
                  </span>
                  <Badge tone={f.direction === "helps" ? "default" : "outline"}>
                    {f.direction}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Correlation reports */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-snugg text-paper">
          Correlation reports
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {reports.map((rep) => (
            <Card key={rep.id} className="flex flex-col p-5">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-paper">{rep.title}</h3>
                {rep.r != null && (
                  <Badge tone="default">
                    r {rep.r > 0 ? "+" : ""}
                    {rep.r}
                  </Badge>
                )}
              </div>
              {rep.r != null && (
                <p className="mb-2 text-[0.7rem] uppercase tracking-wider text-paper/40">
                  {strengthLabel(rep.r)} {rep.r >= 0 ? "positive" : "negative"} · n={rep.n}
                </p>
              )}
              <ScatterChart
                points={rep.points}
                height={170}
                formatX={(v) => `${Math.round(v * 10) / 10}`}
                formatY={(v) => `${Math.round(v * 10) / 10}`}
              />
              <div className="mt-1 flex justify-between text-[0.6rem] text-paper/35">
                <span>{rep.xLabel}</span>
                <span>{rep.yLabel}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-paper/60">
                {rep.insight}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Correlation matrix */}
      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-paper/45" />
          <h3 className="text-base font-semibold text-paper">Correlation matrix</h3>
        </div>
        <p className="mb-4 text-xs text-paper/45">
          Strength of the relationship between each pair (0–100). Darker = stronger.
        </p>
        <MatrixHeatmap
          rowLabels={matrix.labels}
          colLabels={matrix.labels}
          values={matrix.values}
          max={matrix.max}
        />
      </Card>

      {/* Composer */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log today's life metrics"
        className="sm:max-w-xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Date">
            <Input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value, id: `life-${e.target.value}` })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Sleep (hours)">
              <Input
                type="number"
                step="0.25"
                value={draft.sleepHours}
                onChange={(e) => setDraft({ ...draft, sleepHours: parseFloat(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Sleep quality">
              <RatingPicker
                value={draft.sleepQuality}
                onChange={(v) => setDraft({ ...draft, sleepQuality: v })}
              />
            </Field>
            <Field label="Bedtime">
              <Input
                type="time"
                value={draft.bedtime ?? ""}
                onChange={(e) => setDraft({ ...draft, bedtime: e.target.value })}
              />
            </Field>
            <Field label="Wake time">
              <Input
                type="time"
                value={draft.wakeTime ?? ""}
                onChange={(e) => setDraft({ ...draft, wakeTime: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Deep work (hours)">
              <Input
                type="number"
                step="0.25"
                value={draft.deepWorkHours}
                onChange={(e) => setDraft({ ...draft, deepWorkHours: parseFloat(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Screen time (min)">
              <Input
                type="number"
                value={draft.screenTimeMin}
                onChange={(e) => setDraft({ ...draft, screenTimeMin: parseInt(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Exercise (min)">
              <Input
                type="number"
                value={draft.exerciseMinutes}
                onChange={(e) => setDraft({ ...draft, exerciseMinutes: parseInt(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Activity">
              <Select
                value={draft.exerciseType ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    exerciseType: (e.target.value || undefined) as ExerciseType | undefined,
                  })
                }
              >
                <option value="">—</option>
                {EX_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Walk (km)">
              <Input
                type="number"
                step="0.1"
                value={draft.walkKm}
                onChange={(e) => setDraft({ ...draft, walkKm: parseFloat(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Run (km)">
              <Input
                type="number"
                step="0.1"
                value={draft.runKm}
                onChange={(e) => setDraft({ ...draft, runKm: parseFloat(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Water (litres)">
              <Input
                type="number"
                step="0.25"
                value={draft.waterLiters}
                onChange={(e) => setDraft({ ...draft, waterLiters: parseFloat(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Meditation (min)">
              <Input
                type="number"
                value={draft.meditationMin}
                onChange={(e) => setDraft({ ...draft, meditationMin: parseInt(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Weight (kg)">
              <Input
                type="number"
                step="0.1"
                value={draft.weightKg ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    weightKg: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
