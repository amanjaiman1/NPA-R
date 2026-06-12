import type { MockTest, MockType } from "./types";
import { avg, round, fromISODate } from "./utils";

/* ════════════════════════════════════════════════════════════════
   Mock Test analytics engine. Pure functions over MockTest[] that
   power the trading-terminal dashboard: score/accuracy series,
   candlesticks, subject accuracy, time allocation, trend attribution
   ("why are marks moving?") and AI-style recommendations.
   ════════════════════════════════════════════════════════════════ */

function shortLabel(iso: string): string {
  return fromISODate(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

export interface MockPoint {
  id: string;
  date: string;
  label: string;
  name: string;
  type: MockType;
  score: number;
  max: number;
  pct: number;
  accuracy: number | null; // % of attempted that were correct
  attempted: number;
  correct: number;
  wrong: number;
  negative: number;
  timeTaken: number;
}

export function mockPoints(mocks: MockTest[]): MockPoint[] {
  return [...mocks]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => {
      const attempted = m.attempted ?? 0;
      return {
        id: m.id,
        date: m.date,
        label: shortLabel(m.date),
        name: m.name,
        type: m.type,
        score: m.score,
        max: m.max,
        pct: m.max ? round((m.score / m.max) * 100, 1) : 0,
        accuracy:
          attempted > 0 ? round(((m.correct ?? 0) / attempted) * 100, 0) : null,
        attempted,
        correct: m.correct ?? 0,
        wrong: m.wrong ?? 0,
        negative: m.negative ?? 0,
        timeTaken: m.timeTakenMin ?? 0,
      };
    });
}

export function movingAverage(
  values: number[],
  window = 5,
): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    const slice = values.slice(i - window + 1, i + 1);
    return round(avg(slice), 1);
  });
}

/* ── Candlesticks (per-mock OHLC of section performance) ─────── */

export interface Candle {
  date: string;
  label: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  up: boolean;
  name: string;
  score: number;
  max: number;
  accuracy: number | null;
}

export function candles(mocks: MockTest[]): Candle[] {
  const sorted = [...mocks].sort((a, b) => a.date.localeCompare(b.date));
  let prevClose: number | null = null;
  return sorted.map((m) => {
    const close = clampPct(m.max ? (m.score / m.max) * 100 : 0);
    const sectionPcts = (m.sections ?? [])
      .filter((s) => s.max > 0)
      .map((s) => clampPct((s.score / s.max) * 100));
    const high = sectionPcts.length ? Math.max(close, ...sectionPcts) : close + 2;
    const low = sectionPcts.length ? Math.min(close, ...sectionPcts) : close - 2;
    const open = prevClose ?? close;
    prevClose = close;
    const attempted = m.attempted ?? 0;
    return {
      date: m.date,
      label: shortLabel(m.date),
      open: round(open, 1),
      close: round(close, 1),
      high: round(Math.max(high, open, close), 1),
      low: round(Math.max(0, Math.min(low, open, close)), 1),
      volume: attempted || Math.round(m.max / 2),
      up: close >= open,
      name: m.name,
      score: m.score,
      max: m.max,
      accuracy:
        attempted > 0 ? round(((m.correct ?? 0) / attempted) * 100, 0) : null,
    };
  });
}

/* ── Headline summary ────────────────────────────────────────── */

export interface MockSummary {
  count: number;
  latest: MockPoint | null;
  delta: number; // latest pct vs previous
  average: number;
  best: MockPoint | null;
  worst: MockPoint | null;
  accuracyAvg: number | null;
  negativeAvg: number | null;
  projectedScore: number | null; // recent-3 average raw score
}

export function summarize(mocks: MockTest[]): MockSummary {
  const pts = mockPoints(mocks);
  if (!pts.length) {
    return {
      count: 0,
      latest: null,
      delta: 0,
      average: 0,
      best: null,
      worst: null,
      accuracyAvg: null,
      negativeAvg: null,
      projectedScore: null,
    };
  }
  const latest = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const accs = pts.filter((p) => p.accuracy != null).map((p) => p.accuracy!);
  const negs = pts.filter((p) => p.negative > 0).map((p) => p.negative);
  const recent = pts.slice(-3);
  return {
    count: pts.length,
    latest,
    delta: prev ? round(latest.pct - prev.pct, 1) : 0,
    average: round(avg(pts.map((p) => p.pct)), 1),
    best: pts.reduce((m, p) => (p.pct > m.pct ? p : m), pts[0]),
    worst: pts.reduce((m, p) => (p.pct < m.pct ? p : m), pts[0]),
    accuracyAvg: accs.length ? round(avg(accs), 0) : null,
    negativeAvg: negs.length ? round(avg(negs), 1) : null,
    projectedScore: round(avg(recent.map((p) => p.score)), 0),
  };
}

/* ── Subject / section accuracy ──────────────────────────────── */

export interface SubjectAgg {
  name: string;
  attempted: number;
  correct: number;
  wrong: number;
  marks: number;
  max: number;
  samples: number;
  avgTime: number;
  accuracy: number; // %
}

export function subjectAccuracy(mocks: MockTest[]): SubjectAgg[] {
  const map = new Map<string, SubjectAgg>();
  for (const m of mocks) {
    for (const s of m.sections ?? []) {
      const cur =
        map.get(s.name) ??
        {
          name: s.name,
          attempted: 0,
          correct: 0,
          wrong: 0,
          marks: 0,
          max: 0,
          samples: 0,
          avgTime: 0,
          accuracy: 0,
        };
      cur.attempted += s.attempted;
      cur.correct += s.correct;
      cur.wrong += s.wrong;
      cur.marks += s.score;
      cur.max += s.max;
      cur.samples += 1;
      cur.avgTime += s.timeSpent ?? 0;
      map.set(s.name, cur);
    }
  }
  return [...map.values()]
    .map((a) => ({
      ...a,
      avgTime: a.samples ? round(a.avgTime / a.samples, 0) : 0,
      accuracy:
        a.attempted > 0
          ? round((a.correct / a.attempted) * 100, 0)
          : a.max > 0
            ? round((a.marks / a.max) * 100, 0)
            : 0,
    }))
    .sort((x, y) => y.accuracy - x.accuracy);
}

export function strengthsWeaknesses(mocks: MockTest[], minSamples = 2) {
  const subs = subjectAccuracy(mocks).filter((s) => s.samples >= minSamples);
  return {
    strong: subs.slice(0, 4),
    weak: [...subs].reverse().slice(0, 4),
  };
}

/* ── Per-subject recent vs prior accuracy movers ─────────────── */

export function subjectDeltas(mocks: MockTest[], window = 3) {
  const sorted = [...mocks].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-window);
  const prior = sorted.slice(-window * 2, -window);
  const accBy = (list: MockTest[]) => {
    const m = new Map<string, { c: number; a: number }>();
    for (const mk of list)
      for (const s of mk.sections ?? []) {
        if (s.attempted <= 0) continue;
        const cur = m.get(s.name) ?? { c: 0, a: 0 };
        cur.c += s.correct;
        cur.a += s.attempted;
        m.set(s.name, cur);
      }
    return m;
  };
  const r = accBy(recent);
  const p = accBy(prior);
  let improver: { name: string; delta: number } | null = null;
  let decliner: { name: string; delta: number } | null = null;
  for (const [name, rv] of r) {
    const pv = p.get(name);
    if (!pv) continue;
    const d = Math.round((rv.c / rv.a) * 100 - (pv.c / pv.a) * 100);
    if (!improver || d > improver.delta) improver = { name, delta: d };
    if (!decliner || d < decliner.delta) decliner = { name, delta: d };
  }
  return { improver, decliner };
}

/* ── Trend attribution: "why are marks moving?" ──────────────── */

export interface TrendDriver {
  kind: "positive" | "negative";
  label: string;
  detail: string;
  magnitude: number;
}

export interface TrendExplanation {
  direction: "up" | "down" | "flat";
  deltaPct: number;
  recentAvg: number;
  priorAvg: number;
  headline: string;
  drivers: TrendDriver[];
}

export function explainTrend(
  mocks: MockTest[],
  window = 3,
): TrendExplanation | null {
  const pts = mockPoints(mocks);
  if (pts.length < 4) return null;
  const recent = pts.slice(-window);
  const prior = pts.slice(-window * 2, -window);
  if (!prior.length) return null;

  const ra = avg(recent.map((p) => p.pct));
  const pa = avg(prior.map((p) => p.pct));
  const deltaPct = round(ra - pa, 1);
  const direction = deltaPct > 1.5 ? "up" : deltaPct < -1.5 ? "down" : "flat";
  const drivers: TrendDriver[] = [];

  const accR = avg(recent.filter((p) => p.accuracy != null).map((p) => p.accuracy!));
  const accP = avg(prior.filter((p) => p.accuracy != null).map((p) => p.accuracy!));
  if (!Number.isNaN(accR) && !Number.isNaN(accP)) {
    const d = Math.round(accR - accP);
    if (Math.abs(d) >= 1)
      drivers.push({
        kind: d > 0 ? "positive" : "negative",
        label: "Accuracy",
        detail: `${d > 0 ? "Up" : "Down"} ${Math.abs(d)} pts (${Math.round(accP)}% → ${Math.round(accR)}%)`,
        magnitude: Math.abs(d) * 1.5,
      });
  }

  const atR = avg(recent.map((p) => p.attempted));
  const atP = avg(prior.map((p) => p.attempted));
  const dat = Math.round(atR - atP);
  if (Math.abs(dat) >= 2)
    drivers.push({
      kind: dat > 0 ? "positive" : "negative",
      label: "Attempt rate",
      detail: `${dat > 0 ? "+" : ""}${dat} questions attempted per mock`,
      magnitude: Math.abs(dat),
    });

  const negR = avg(recent.map((p) => p.negative));
  const negP = avg(prior.map((p) => p.negative));
  const dneg = round(negR - negP, 1);
  if (Math.abs(dneg) >= 1)
    drivers.push({
      kind: dneg < 0 ? "positive" : "negative",
      label: "Negative marking",
      detail: `${dneg < 0 ? "−" : "+"}${Math.abs(dneg)} marks lost to negatives`,
      magnitude: Math.abs(dneg) * 1.2,
    });

  const movers = subjectDeltas(mocks, window);
  if (movers.improver && movers.improver.delta >= 4)
    drivers.push({
      kind: "positive",
      label: movers.improver.name,
      detail: `Accuracy up ${movers.improver.delta} pts recently`,
      magnitude: movers.improver.delta,
    });
  if (movers.decliner && movers.decliner.delta <= -4)
    drivers.push({
      kind: "negative",
      label: movers.decliner.name,
      detail: `Accuracy down ${Math.abs(movers.decliner.delta)} pts recently`,
      magnitude: Math.abs(movers.decliner.delta),
    });

  drivers.sort((a, b) => b.magnitude - a.magnitude);

  const headline =
    direction === "up"
      ? `Scores are climbing — up ${deltaPct} pts vs the previous ${window} mocks.`
      : direction === "down"
        ? `Scores have dipped — down ${Math.abs(deltaPct)} pts vs the previous ${window} mocks.`
        : `Scores are holding steady (${deltaPct >= 0 ? "+" : ""}${deltaPct} pts).`;

  return {
    direction,
    deltaPct,
    recentAvg: round(ra, 0),
    priorAvg: round(pa, 0),
    headline,
    drivers: drivers.slice(0, 5),
  };
}

/* ── AI-style recommendations ────────────────────────────────── */

export interface Recommendation {
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
}

export function recommendations(mocks: MockTest[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const subs = subjectAccuracy(mocks).filter((s) => s.samples >= 2);

  const weak = subs
    .filter((s) => s.attempted > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 2);
  for (const w of weak) {
    if (w.accuracy < 60)
      recs.push({
        priority: w.accuracy < 50 ? "high" : "medium",
        title: `Shore up ${w.name}`,
        detail: `Accuracy is ${w.accuracy}% across ${w.samples} mocks — among your lowest. Targeted revision plus 100 fresh MCQs would move this fast.`,
      });
  }

  const prelims = mocks.filter(
    (m) => m.type === "Prelims GS" && m.negative != null,
  );
  if (prelims.length) {
    const negAvg = round(avg(prelims.map((m) => m.negative as number)), 0);
    const atAvg = round(avg(prelims.map((m) => m.attempted ?? 0)), 0);
    if (negAvg >= 14)
      recs.push({
        priority: "high",
        title: "Tame negative marking",
        detail: `You're losing ~${negAvg} marks per mock to negatives. Apply the elimination rule — skip unless you can rule out two options.`,
      });
    if (atAvg < 85)
      recs.push({
        priority: "medium",
        title: "Lift your attempt rate",
        detail: `Averaging ${atAvg}/100 attempts. A few more educated attempts in strong subjects can add 4–6 marks.`,
      });
    else if (atAvg > 95 && negAvg >= 14)
      recs.push({
        priority: "medium",
        title: "You're over-attempting",
        detail: `${atAvg}/100 attempts with high negatives — trade volume for precision.`,
      });
  }

  const timed = subs.filter((s) => s.avgTime > 0 && s.attempted > 0);
  const inefficient = [...timed].sort(
    (a, b) => a.accuracy / a.avgTime - b.accuracy / b.avgTime,
  )[0];
  if (inefficient && inefficient.avgTime >= 14 && inefficient.accuracy < 60)
    recs.push({
      priority: "medium",
      title: `Cap your time on ${inefficient.name}`,
      detail: `~${inefficient.avgTime} min spent for only ${inefficient.accuracy}% accuracy — set a hard limit and bank time elsewhere.`,
    });

  const tr = explainTrend(mocks);
  if (tr?.direction === "down") {
    const d = tr.drivers.find((x) => x.kind === "negative");
    if (d)
      recs.push({
        priority: "high",
        title: `Reverse the slide in ${d.label}`,
        detail: `${d.detail}. This is the biggest drag on your recent scores.`,
      });
  }

  const strong = subs
    .filter((s) => s.attempted > 0)
    .sort((a, b) => b.accuracy - a.accuracy)[0];
  if (strong && strong.accuracy >= 70)
    recs.push({
      priority: "low",
      title: `Keep banking ${strong.name}`,
      detail: `${strong.accuracy}% accuracy — your most reliable scorer. Light maintenance revision keeps it locked in.`,
    });

  return recs.slice(0, 6);
}
