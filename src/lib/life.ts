import type { LifeEntry, JournalEntry, MockTest } from "./types";
import { avg, round, sum, toISODate, daysBetween } from "./utils";

/* ════════════════════════════════════════════════════════════════
   Life Dashboard analytics. Pure functions over the daily life log
   (+ journal + mocks) powering daily/weekly analytics and the
   correlation engine that links lifestyle factors to performance.
   ════════════════════════════════════════════════════════════════ */

export const LIFE_TARGETS = {
  sleepHours: 7.5,
  deepWorkHours: 6,
  waterLiters: 3,
  meditationMin: 15,
  exerciseMinutes: 30,
  walkKm: 5,
  screenTimeMin: 90, // a ceiling, not a floor
};

export type LifeMetricKey =
  | "sleepHours"
  | "sleepQuality"
  | "deepWorkHours"
  | "exerciseMinutes"
  | "walkKm"
  | "runKm"
  | "waterLiters"
  | "meditationMin"
  | "screenTimeMin"
  | "weightKg";

const TODAY = () => toISODate(new Date());

export function todayEntry(
  lifeLog: LifeEntry[],
  today = TODAY(),
): LifeEntry | undefined {
  return lifeLog.find((l) => l.date === today);
}

/* ── Per-day metric maps (from all sources) ──────────────────── */

function lifeMap(lifeLog: LifeEntry[], key: LifeMetricKey): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of lifeLog) {
    const v = e[key];
    if (typeof v === "number") m.set(e.date, v);
  }
  return m;
}

export function studyMap(journal: JournalEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of journal) m.set(e.date, e.totalHours);
  return m;
}
export function moodMap(journal: JournalEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of journal) m.set(e.date, e.mood);
  return m;
}
export function revisionMap(journal: JournalEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of journal) m.set(e.date, e.revisionSessions?.length ?? 0);
  return m;
}

/* ── Weekly analytics ────────────────────────────────────────── */

/** Average of a metric over a trailing 7-day window. weekOffset 0 = last 7d. */
export function weeklyAvg(
  lifeLog: LifeEntry[],
  key: LifeMetricKey,
  weekOffset = 0,
  today = TODAY(),
): number | null {
  const lo = weekOffset * 7;
  const hi = lo + 7;
  const vals: number[] = [];
  for (const e of lifeLog) {
    const age = daysBetween(e.date, today);
    if (age >= lo && age < hi) {
      const v = e[key];
      if (typeof v === "number") vals.push(v);
    }
  }
  return vals.length ? round(avg(vals), 1) : null;
}

export interface WeekMetric {
  key: LifeMetricKey;
  label: string;
  unit: string;
  thisWeek: number | null;
  lastWeek: number | null;
  delta: number | null;
  goodWhenUp: boolean;
  spark: number[];
}

const WEEK_METRICS: { key: LifeMetricKey; label: string; unit: string; goodWhenUp: boolean }[] = [
  { key: "sleepHours", label: "Sleep", unit: "h", goodWhenUp: true },
  { key: "deepWorkHours", label: "Deep work", unit: "h", goodWhenUp: true },
  { key: "exerciseMinutes", label: "Exercise", unit: "m", goodWhenUp: true },
  { key: "waterLiters", label: "Water", unit: "L", goodWhenUp: true },
  { key: "meditationMin", label: "Meditation", unit: "m", goodWhenUp: true },
  { key: "screenTimeMin", label: "Screen", unit: "m", goodWhenUp: false },
];

export function weeklyReport(
  lifeLog: LifeEntry[],
  today = TODAY(),
): WeekMetric[] {
  return WEEK_METRICS.map((m) => {
    const thisWeek = weeklyAvg(lifeLog, m.key, 0, today);
    const lastWeek = weeklyAvg(lifeLog, m.key, 1, today);
    const delta =
      thisWeek != null && lastWeek != null ? round(thisWeek - lastWeek, 1) : null;
    // 14-day sparkline (oldest → newest)
    const spark: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const iso = toISODate(new Date(Date.now() - i * 86400000));
      const e = lifeLog.find((x) => x.date === iso);
      const v = e ? (e[m.key] as number) : 0;
      spark.push(typeof v === "number" ? v : 0);
    }
    return { ...m, thisWeek, lastWeek, delta, spark };
  });
}

/* ── Correlation engine ──────────────────────────────────────── */

export function pearson(pairs: [number, number][]): number | null {
  const n = pairs.length;
  if (n < 3) return null;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pairs) {
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  const cov = sxy - (sx * sy) / n;
  const vx = sxx - (sx * sx) / n;
  const vy = syy - (sy * sy) / n;
  if (vx <= 0 || vy <= 0) return null;
  return cov / Math.sqrt(vx * vy);
}

function align(x: Map<string, number>, y: Map<string, number>): [number, number][] {
  const pairs: [number, number][] = [];
  for (const [date, vx] of x) {
    const vy = y.get(date);
    if (vy != null) pairs.push([vx, vy]);
  }
  return pairs;
}

export function strengthLabel(r: number): string {
  const a = Math.abs(r);
  if (a < 0.2) return "negligible";
  if (a < 0.4) return "weak";
  if (a < 0.6) return "moderate";
  if (a < 0.8) return "strong";
  return "very strong";
}

/* ── Lifestyle factors affecting performance ─────────────────── */

export interface FactorImpact {
  key: LifeMetricKey;
  label: string;
  r: number;
  n: number;
  direction: "helps" | "hurts";
}

const FACTORS: { key: LifeMetricKey; label: string }[] = [
  { key: "sleepHours", label: "Sleep hours" },
  { key: "sleepQuality", label: "Sleep quality" },
  { key: "exerciseMinutes", label: "Exercise" },
  { key: "walkKm", label: "Walking" },
  { key: "runKm", label: "Running" },
  { key: "waterLiters", label: "Water intake" },
  { key: "meditationMin", label: "Meditation" },
  { key: "screenTimeMin", label: "Screen time" },
  { key: "weightKg", label: "Weight" },
];

/** Correlate each lifestyle factor with daily study hours (performance proxy). */
export function factorImpact(
  lifeLog: LifeEntry[],
  journal: JournalEntry[],
): FactorImpact[] {
  const study = studyMap(journal);
  const out: FactorImpact[] = [];
  for (const f of FACTORS) {
    const pairs = align(lifeMap(lifeLog, f.key), study);
    const r = pearson(pairs);
    if (r == null || pairs.length < 6) continue;
    out.push({
      key: f.key,
      label: f.label,
      r: round(r, 2),
      n: pairs.length,
      direction: r >= 0 ? "helps" : "hurts",
    });
  }
  return out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
}

/* ── Correlation matrix (absolute strength) ──────────────────── */

export interface CorrMatrix {
  labels: string[];
  values: number[][]; // 0-100 (|r| * 100)
  max: number;
}

export function correlationMatrix(
  lifeLog: LifeEntry[],
  journal: JournalEntry[],
): CorrMatrix {
  const series: { label: string; map: Map<string, number> }[] = [
    { label: "Study", map: studyMap(journal) },
    { label: "Deep work", map: lifeMap(lifeLog, "deepWorkHours") },
    { label: "Sleep", map: lifeMap(lifeLog, "sleepHours") },
    { label: "Exercise", map: lifeMap(lifeLog, "exerciseMinutes") },
    { label: "Water", map: lifeMap(lifeLog, "waterLiters") },
    { label: "Screen", map: lifeMap(lifeLog, "screenTimeMin") },
  ];
  const labels = series.map((s) => s.label);
  const values = series.map((a, i) =>
    series.map((b, j) => {
      if (i === j) return 100;
      const r = pearson(align(a.map, b.map));
      return r == null ? 0 : Math.round(Math.abs(r) * 100);
    }),
  );
  return { labels, values, max: 100 };
}

/* ── Curated correlation reports ─────────────────────────────── */

export interface CorrelationReport {
  id: string;
  title: string;
  xLabel: string;
  yLabel: string;
  points: { x: number; y: number }[];
  r: number | null;
  n: number;
  insight: string;
}

function describe(
  r: number | null,
  positiveMsg: string,
  negativeMsg: string,
  weakMsg: string,
): string {
  if (r == null) return "Not enough overlapping data yet — keep logging.";
  if (Math.abs(r) < 0.2) return weakMsg;
  return r >= 0 ? positiveMsg : negativeMsg;
}

export function correlationReports(
  lifeLog: LifeEntry[],
  journal: JournalEntry[],
  mocks: MockTest[],
  today = TODAY(),
): CorrelationReport[] {
  const reports: CorrelationReport[] = [];

  // 1) Study hours vs sleep quality (same day)
  {
    const sq = lifeMap(lifeLog, "sleepQuality");
    const study = studyMap(journal);
    const pairs = align(sq, study); // [sleepQuality, study]
    const r = pearson(pairs);
    reports.push({
      id: "study-sleep",
      title: "Study hours vs sleep quality",
      xLabel: "Sleep quality (1–5)",
      yLabel: "Study hours",
      points: pairs.map(([x, y]) => ({ x, y })),
      r: r == null ? null : round(r, 2),
      n: pairs.length,
      insight: describe(
        r,
        `Better-rested days show more study output (${strengthLabel(r ?? 0)} link). Protect your sleep to protect your hours.`,
        "Oddly, higher sleep quality tracks with fewer hours here — likely noise; keep logging.",
        "Sleep quality and study hours move fairly independently in your data so far.",
      ),
    });
  }

  // 2) Mock score vs exercise consistency (weekly)
  {
    const exDaysByWeek = new Map<number, number>();
    for (const e of lifeLog) {
      const wk = Math.floor(daysBetween(e.date, today) / 7);
      if (e.exerciseMinutes > 0)
        exDaysByWeek.set(wk, (exDaysByWeek.get(wk) ?? 0) + 1);
      else if (!exDaysByWeek.has(wk)) exDaysByWeek.set(wk, 0);
    }
    const mockByWeek = new Map<number, number[]>();
    for (const m of mocks) {
      if (!m.max) continue;
      const wk = Math.floor(daysBetween(m.date, today) / 7);
      if (wk < 0) continue;
      const arr = mockByWeek.get(wk) ?? [];
      arr.push((m.score / m.max) * 100);
      mockByWeek.set(wk, arr);
    }
    const pairs: [number, number][] = [];
    for (const [wk, scores] of mockByWeek) {
      const ex = exDaysByWeek.get(wk);
      if (ex == null) continue;
      pairs.push([ex, round(avg(scores), 1)]);
    }
    const r = pearson(pairs);
    reports.push({
      id: "mock-exercise",
      title: "Mock score vs exercise consistency",
      xLabel: "Exercise days / week",
      yLabel: "Avg mock %",
      points: pairs.map(([x, y]) => ({ x, y })),
      r: r == null ? null : round(r, 2),
      n: pairs.length,
      insight: describe(
        r,
        `Weeks you move more tend to score higher (${strengthLabel(r ?? 0)} link). Exercise looks like a performance multiplier, not a distraction.`,
        "More exercise weeks track with slightly lower scores here — likely a busy-week artefact.",
        "Exercise consistency and mock scores look roughly independent so far.",
      ),
    });
  }

  // 3) Mood vs revision completion (same day)
  {
    const mood = moodMap(journal);
    const rev = revisionMap(journal);
    const pairs = align(rev, mood); // [revisionCount, mood]
    const r = pearson(pairs);
    reports.push({
      id: "mood-revision",
      title: "Mood vs revision completion",
      xLabel: "Revision sessions",
      yLabel: "Mood (1–5)",
      points: pairs.map(([x, y]) => ({ x, y })),
      r: r == null ? null : round(r, 2),
      n: pairs.length,
      insight: describe(
        r,
        `Days you clear revision tend to feel better (${strengthLabel(r ?? 0)} link). Completion fuels mood — and mood fuels completion.`,
        "More revision tracks with lower mood here — watch for revision fatigue.",
        "Mood and revision completion move fairly independently in your data so far.",
      ),
    });
  }

  return reports;
}

/* ── Daily totals helper ─────────────────────────────────────── */

export function weekTotals(lifeLog: LifeEntry[], today = TODAY()) {
  const week = lifeLog.filter((e) => daysBetween(e.date, today) < 7);
  return {
    exerciseMinutes: Math.round(sum(week.map((e) => e.exerciseMinutes))),
    walkKm: round(sum(week.map((e) => e.walkKm)), 1),
    runKm: round(sum(week.map((e) => e.runKm)), 1),
    exerciseDays: week.filter((e) => e.exerciseMinutes > 0).length,
  };
}
