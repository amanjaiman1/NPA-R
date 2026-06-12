/* ════════════════════════════════════════════════════════════════
   TIMELINE & LEGACY ENGINE — the documentary of a journey
   ────────────────────────────────────────────────────────────────
   This module turns the raw Chronicle into a narrated life-story. It
   is the answer to "years later, scroll through your whole journey".

   It has four responsibilities, mirroring the brief:

   1. DATABASE STRUCTURE   A normalised `TimelineEvent` — the unit of
                           memory. Auto-derived events and hand-written
                           milestones collapse into this one shape, so
                           the UI never cares where a memory came from.
   2. MILESTONE AUTOMATION deriveAutoEvents() scans hours, mocks, books,
                           subjects, revision and the selection journey
                           and emits events the user never had to log:
                           Day 1, first mock, first 10-hour day, book &
                           subject completions, revision milestones,
                           Prelims / Mains / Interview / Final Result.
   3. MEMORY GENERATION    Every auto event is given documentary prose —
                           grounded in the real numbers — so the line
                           reads like narration, not a database row.
   4. TIMELINE ARCHITECTURE buildTimeline() merges + sorts + dedupes, and
                           groupIntoChapters() arranges everything into
                           journey-year "acts" so it scales across years.

   Pure functions only: (ChronicleData) → values.
   ════════════════════════════════════════════════════════════════ */

import type { ChronicleData, ISODate, Profile, SelectionStage } from "./types";
import { subjectMastery, mockSeries } from "./selectors";
import {
  toISODate,
  fromISODate,
  daysBetween,
  formatDate,
  round,
} from "./utils";

/* ════════════════════════════════════════════════════════════════
   1. DATABASE STRUCTURE — the unit of memory
   ════════════════════════════════════════════════════════════════ */

export type EventCategory =
  | "Origin"
  | "Study"
  | "Mock"
  | "Book"
  | "Subject"
  | "Revision"
  | "Exam"
  | "Result"
  | "Milestone"
  | "Setback"
  | "Personal";

export interface TimelineEvent {
  id: string;
  date: ISODate;
  dayNumber: number; // days since Day Zero
  category: EventCategory;
  icon: string; // lucide key, resolved in the UI
  title: string; // the documentary headline
  narrative: string; // memory-generated prose
  detail?: string; // a factual sub-line (score, pages, hours…)
  source: "auto" | "manual" | "selection";
  importance: number; // 1 (minor) … 5 (defining moment)
  future?: boolean; // the road ahead
  pinned?: boolean;
  refId?: string; // underlying milestone id (manual events are editable)
}

export interface JourneyChapter {
  id: string;
  act: string; // "Year One"
  title: string; // thematic chapter title
  subtitle: string; // documentary narration
  startDay: number;
  endDay: number;
  startDate: ISODate;
  endDate: ISODate;
  future?: boolean;
  events: TimelineEvent[];
}

export interface LegacyStats {
  journeyDays: number;
  totalHours: number;
  studyDays: number;
  booksCompleted: number;
  mocksTaken: number;
  bestMockPct: number | null;
  topicsMastered: number;
  totalTopics: number;
  attempts: number;
  currentStage: string;
  recorded: number; // total events on the timeline
  autoRecorded: number;
}

/* ── small deterministic helpers (stable prose across renders) ── */

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function pickStable<T>(arr: T[], seed: string): T {
  return arr[hashStr(seed) % arr.length];
}
function ordinalWord(n: number): string {
  const words = [
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
  ];
  return words[n - 1] ?? String(n);
}
function ordinalNum(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
function commas(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

/* ════════════════════════════════════════════════════════════════
   2 + 3. MILESTONE AUTOMATION + MEMORY GENERATION
   ════════════════════════════════════════════════════════════════ */

/**
 * Scan the entire Chronicle and emit the events a candidate never had to
 * log by hand. Each event carries machine-generated, number-grounded prose.
 */
export function deriveAutoEvents(
  data: ChronicleData,
  today: ISODate = toISODate(new Date()),
): TimelineEvent[] {
  const { profile, journal, mocks, books, subjects, selection } = data;
  const start = profile.startDate;
  const dayOf = (d: ISODate) => Math.max(0, daysBetween(start, d));
  const out: TimelineEvent[] = [];

  const push = (e: Omit<TimelineEvent, "dayNumber">) =>
    out.push({ ...e, dayNumber: dayOf(e.date) });

  /* ── Day 1 of preparation ── */
  push({
    id: "auto-origin",
    date: start,
    category: "Origin",
    icon: "Sunrise",
    title: "Day Zero",
    detail: `The journey begins · ${formatDate(start)}`,
    source: "auto",
    importance: 5,
    pinned: true,
    narrative: `It started quietly, the way most serious things do — a decision made on ${formatDate(
      start,
    )} to chase ${profile.targetExam}. No fanfare, just a desk, a syllabus, and a promise. Everything that follows is measured from this morning.`,
  });

  /* ── First 10-hour study day ── */
  const tenHour = [...journal]
    .filter((e) => e.totalHours >= 10)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (tenHour) {
    push({
      id: "auto-ten-hour",
      date: tenHour.date,
      category: "Study",
      icon: "Clock",
      title: "The first ten-hour day",
      detail: `${round(tenHour.totalHours, 1)} hours · day ${dayOf(tenHour.date)}`,
      source: "auto",
      importance: 4,
      narrative: `On day ${dayOf(
        tenHour.date,
      )}, the clock crossed ten hours for the first time — ${round(
        tenHour.totalHours,
        1,
      )}h of unbroken intent. Stamina, it turned out, was a skill that could be built like any other.`,
    });
  }

  /* ── First mock test ── */
  const mockChrono = [...mocks].sort((a, b) => a.date.localeCompare(b.date));
  // full-length papers (≥150 max) are the fair basis for "best"/"safe zone"
  const fullLengths = mockChrono.filter((m) => (m.max ?? 0) >= 150);
  const firstMock = mockChrono[0];
  if (firstMock) {
    const pct = Math.round((firstMock.score / firstMock.max) * 100);
    push({
      id: "auto-first-mock",
      date: firstMock.date,
      category: "Mock",
      icon: "Target",
      title: "First mock test",
      detail: `${firstMock.name} · ${Math.round(firstMock.score)}/${firstMock.max} (${pct}%)`,
      source: "auto",
      importance: 4,
      narrative: `The first real mirror: ${Math.round(firstMock.score)} out of ${firstMock.max}. ${
        pct < 45
          ? "A humbling number — and exactly the baseline worth beating."
          : "A fair start, and a number with plenty of room to climb."
      } The scoreboard would never be flattering again, but it would always be honest.`,
    });

    /* First full-length mock to cross the safe line */
    const crossed = fullLengths.find((m) => m.score / m.max >= 0.5);
    if (crossed && crossed.id !== firstMock.id) {
      const cpct = Math.round((crossed.score / crossed.max) * 100);
      push({
        id: "auto-mock-50",
        date: crossed.date,
        category: "Mock",
        icon: "TrendingUp",
        title: "Broke into the safe zone",
        detail: `${Math.round(crossed.score)}/${crossed.max} (${cpct}%)`,
        source: "auto",
        importance: 3,
        narrative: `Months of retrieval practice surfaced on the scoreboard — the first full-length above the ${cpct}% line. Proof that the slow work was compounding where it couldn't be seen.`,
      });
    }

    /* Personal best (full-length papers only, so a small sectional can't win) */
    const bestPool = fullLengths.length >= 2 ? fullLengths : [];
    if (bestPool.length) {
      const best = [...bestPool].sort(
        (a, b) => b.score / b.max - a.score / a.max,
      )[0];
      const bpct = Math.round((best.score / best.max) * 100);
      if (best.id !== firstMock.id) {
        push({
          id: "auto-mock-best",
          date: best.date,
          category: "Mock",
          icon: "Trophy",
          title: "A new personal best",
          detail: `${best.name} · ${Math.round(best.score)}/${best.max} (${bpct}%)`,
          source: "auto",
          importance: 4,
          narrative: `Everything clicked on ${formatDate(
            best.date,
          )} — a career-best ${Math.round(best.score)}/${best.max} (${bpct}%). Not luck; the quiet arithmetic of consistency finally cashing out.`,
        });
      }
    }
  }

  /* ── Book completions ── */
  const finished = books
    .filter((b) => b.status === "Completed" && b.finishedOn)
    .sort((a, b) => (a.finishedOn as string).localeCompare(b.finishedOn as string));
  for (const b of finished) {
    push({
      id: `auto-book-${b.id}`,
      date: b.finishedOn as ISODate,
      category: "Book",
      icon: "BookCheck",
      title: `Finished ${b.title}`,
      detail: `${b.author} · ${commas(b.totalPages)} pages${b.isStandard ? " · standard text" : ""}`,
      source: "auto",
      importance: b.isStandard ? 3 : 2,
      narrative: pickStable(
        [
          `${b.title} — closed for good. ${commas(b.totalPages)} pages of ${b.author}, from first highlight to last revision. Another brick in the wall.`,
          `The last page of ${b.author}'s ${b.title} turned on ${formatDate(
            b.finishedOn as ISODate,
          )}. ${b.isStandard ? "A standard text, now internalised rather than merely read." : "Read, annotated, absorbed."}`,
        ],
        b.id,
      ),
    });
  }

  /* ── Subject completions (mastery) ── */
  for (const s of subjects) {
    if (!s.topics.length) continue;
    const mastery = subjectMastery(s);
    if (mastery < 80) continue;
    const lastTouched = s.topics
      .map((t) => t.lastTouched)
      .filter((d): d is string => Boolean(d))
      .sort()
      .pop();
    const date = lastTouched ?? today;
    push({
      id: `auto-subject-${s.id}`,
      date,
      category: "Subject",
      icon: "GraduationCap",
      title: `${s.name} — mastered`,
      detail: `${s.topics.length} topics · ${mastery}% mastery`,
      source: "auto",
      importance: 4,
      narrative: `All ${s.topics.length} topics of ${s.name} crossed into mastery — ${mastery}% confidence across the board. A subject that once felt like a mountain now reads like a map.`,
    });
  }

  /* ── Revision milestones (cumulative recall sessions) ── */
  const revDays = [...journal]
    .filter((e) => (e.revisionSessions?.length ?? 0) > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const thresholds = [50, 100, 250, 500, 1000];
  let cumulative = 0;
  const hit = new Set<number>();
  for (const e of revDays) {
    cumulative += e.revisionSessions?.length ?? 0;
    for (const t of thresholds) {
      if (cumulative >= t && !hit.has(t)) {
        hit.add(t);
        push({
          id: `auto-revision-${t}`,
          date: e.date,
          category: "Revision",
          icon: "Repeat",
          title: `${commas(t)} revision sessions`,
          detail: `Spaced recall · day ${dayOf(e.date)}`,
          source: "auto",
          importance: t >= 250 ? 3 : 2,
          narrative: `The ${ordinalNum(t)} revision session, logged on ${formatDate(
            e.date,
          )}. Somewhere in this pile of repetitions, forgetting quietly lost the war.`,
        });
      }
    }
  }

  /* ── The selection journey: Prelims → Mains → Interview → Result ── */
  for (const stage of selection) {
    out.push(selectionToEvent(stage, dayOf, today));
  }

  return out;
}

const STAGE_ICON: Record<string, string> = {
  Prelims: "FileCheck2",
  Mains: "PenLine",
  Interview: "Mic",
  "Final Result": "Award",
};

function selectionToEvent(
  stage: SelectionStage,
  dayOf: (d: ISODate) => number,
  today: ISODate,
): TimelineEvent {
  const isResult = stage.name === "Final Result";
  const cleared = stage.status === "Cleared";
  const failed = stage.status === "Not Cleared";
  const awaiting = stage.status === "Awaiting Result";
  const locked = stage.status === "Locked" || !stage.date;

  // future / locked stages get a synthesised ordering date ("the road ahead")
  const horizon: Record<string, number> = {
    Mains: 30,
    Interview: 75,
    "Final Result": 150,
    Prelims: 20,
  };
  const date =
    stage.date ??
    toISODate(
      (() => {
        const d = fromISODate(today);
        d.setDate(d.getDate() + (horizon[stage.name] ?? 90));
        return d;
      })(),
    );

  const category: EventCategory = isResult
    ? "Result"
    : failed
      ? "Setback"
      : "Exam";

  let narrative: string;
  if (locked) {
    narrative = isResult
      ? `The final page, still unwritten: a name in the list, a service allotted, a uniform earned. This is the moment the whole story has been pointing toward.`
      : `Ahead on the road — ${stage.name} (${stage.attempt}). ${stage.notes ?? "Preparation continues."}`;
  } else if (cleared) {
    narrative = `${stage.name} ${stage.attempt}: cleared${stage.score && stage.score !== "—" ? ` with ${stage.score}` : ""}. ${stage.notes ?? "A gate that stops most, crossed."}`;
  } else if (failed) {
    narrative = `${stage.name} ${stage.attempt}: ${stage.score && stage.score !== "—" ? `${stage.score}, ` : ""}short of the line. ${stage.notes ?? "It stung — and it sharpened everything that came after."}`;
  } else if (awaiting) {
    narrative = `${stage.name} ${stage.attempt}: written, submitted, and now the hardest part — the wait. ${stage.notes ?? ""}`.trim();
  } else {
    narrative = `${stage.name} ${stage.attempt}. ${stage.notes ?? ""}`.trim();
  }

  return {
    id: `auto-stage-${stage.id}`,
    date,
    dayNumber: dayOf(date),
    category,
    icon: STAGE_ICON[stage.name] ?? "Flag",
    title: locked
      ? `${stage.name} — ${stage.attempt}`
      : `${stage.name} ${stage.attempt} — ${stage.status}`,
    detail:
      stage.score && stage.score !== "—"
        ? `${stage.score}${stage.date ? ` · ${formatDate(stage.date)}` : ""}`
        : locked
          ? "The road ahead"
          : stage.date
            ? formatDate(stage.date)
            : undefined,
    source: "selection",
    importance: isResult ? 5 : cleared || failed ? 5 : 4,
    future: locked || date > today,
    pinned: isResult || cleared,
    narrative,
  };
}

/* ════════════════════════════════════════════════════════════════
   Manual milestones → events (so hand-written memories merge in)
   ════════════════════════════════════════════════════════════════ */

const MILESTONE_MAP: Record<string, { category: EventCategory; icon: string }> = {
  Start: { category: "Origin", icon: "Sunrise" },
  Exam: { category: "Exam", icon: "CalendarClock" },
  Achievement: { category: "Milestone", icon: "Trophy" },
  Phase: { category: "Study", icon: "Layers" },
  Personal: { category: "Personal", icon: "Heart" },
  Setback: { category: "Setback", icon: "TriangleAlert" },
  Selection: { category: "Result", icon: "Award" },
};

function manualToEvents(
  data: ChronicleData,
  today: ISODate,
): TimelineEvent[] {
  const start = data.profile.startDate;
  return data.milestones.map((m) => {
    const map = MILESTONE_MAP[m.type] ?? {
      category: "Milestone" as EventCategory,
      icon: "Flag",
    };
    return {
      id: `manual-${m.id}`,
      date: m.date,
      dayNumber: Math.max(0, daysBetween(start, m.date)),
      category: map.category,
      icon: map.icon,
      title: m.title,
      detail: formatDate(m.date),
      narrative: m.description ?? "A moment worth remembering.",
      source: "manual" as const,
      importance: m.pinned ? 5 : 3,
      future: m.date > today,
      pinned: m.pinned,
      refId: m.id,
    };
  });
}

/* ════════════════════════════════════════════════════════════════
   4. TIMELINE ARCHITECTURE — merge, dedupe, sort, chapter
   ════════════════════════════════════════════════════════════════ */

/**
 * The complete, ordered life-story: automated events + hand-written
 * milestones, de-duplicated and sorted oldest-first.
 */
export function buildTimeline(
  data: ChronicleData,
  today: ISODate = toISODate(new Date()),
): TimelineEvent[] {
  const auto = deriveAutoEvents(data, today);
  const manual = manualToEvents(data, today);

  // Dedupe: if a hand-written milestone sits on the same day + category as
  // an auto event, the human memory wins (it carries the personal note).
  const manualKeys = new Set(manual.map((m) => `${m.date}|${m.category}`));
  const merged = [
    ...auto.filter((a) => !manualKeys.has(`${a.date}|${a.category}`)),
    ...manual,
  ];

  return merged.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || b.importance - a.importance,
  );
}

/** Aggregate the headline "legacy" numbers for the hero band. */
export function buildLegacyStats(
  data: ChronicleData,
  events: TimelineEvent[],
  today: ISODate = toISODate(new Date()),
): LegacyStats {
  const { profile, journal, mocks, books, subjects, selection } = data;
  const series = mockSeries(mocks);
  const fullLengthPct = mocks
    .filter((m) => (m.max ?? 0) >= 150)
    .map((m) => Math.round((m.score / m.max) * 100));
  const bestMockPct = fullLengthPct.length
    ? Math.max(...fullLengthPct)
    : series.length
      ? Math.max(...series.map((s) => s.pct))
      : null;
  const topicsMastered = subjects.reduce(
    (n, s) => n + s.topics.filter((t) => t.status === "mastered").length,
    0,
  );
  const totalTopics = subjects.reduce((n, s) => n + s.topics.length, 0);

  // current stage = most recent dated stage, or the next locked gate
  const dated = selection
    .filter((s) => s.date)
    .sort((a, b) => (b.date as string).localeCompare(a.date as string));
  const nextLocked = selection.find((s) => s.status === "Locked");
  const currentStage = dated[0]
    ? `${dated[0].name} · ${dated[0].status}`
    : nextLocked
      ? `${nextLocked.name} · upcoming`
      : "In preparation";

  return {
    journeyDays: Math.max(0, daysBetween(profile.startDate, today)),
    totalHours: Math.round(journal.reduce((a, e) => a + e.totalHours, 0)),
    studyDays: journal.filter((e) => e.totalHours > 0).length,
    booksCompleted: books.filter((b) => b.status === "Completed").length,
    mocksTaken: mocks.length,
    bestMockPct,
    topicsMastered,
    totalTopics,
    attempts: selection.filter((s) => s.name === "Prelims").length || profile.attemptNumber,
    currentStage,
    recorded: events.length,
    autoRecorded: events.filter((e) => e.source !== "manual").length,
  };
}

/* ── chapter theming ── */

function chapterTheme(events: TimelineEvent[], isFirst: boolean): {
  title: string;
  subtitle: string;
} {
  const cats = new Set(events.map((e) => e.category));
  const hasClearedResult = events.some(
    (e) => e.category === "Result" && /cleared|name in the list/i.test(e.narrative),
  );
  const hasCleared = events.some((e) => /cleared/i.test(e.title));
  const hasSetback = cats.has("Setback");

  if (isFirst)
    return {
      title: "Foundations",
      subtitle: "Where it began — the first hours, the first humbling mock, the base being laid one chapter at a time.",
    };
  if (hasClearedResult || hasCleared)
    return {
      title: "Breakthrough",
      subtitle: "The year the scoreboard turned — gates that stop most, crossed.",
    };
  if (hasSetback)
    return {
      title: "Setback & Resolve",
      subtitle: "A door closed, and the harder, quieter work of coming back began.",
    };
  if (cats.has("Subject") || cats.has("Book"))
    return {
      title: "Deepening Mastery",
      subtitle: "Books closed, subjects conquered — the syllabus turning from mountain to map.",
    };
  return {
    title: "The Grind",
    subtitle: "Showing up, day after day, while the work compounded out of sight.",
  };
}

/**
 * Arrange the timeline into journey-year "acts" so it reads like a
 * documentary and scales gracefully across multiple years. Future events
 * collapse into a closing "The Road Ahead" chapter.
 */
export function groupIntoChapters(
  events: TimelineEvent[],
  today: ISODate = toISODate(new Date()),
): JourneyChapter[] {
  const past = events.filter((e) => !e.future && e.date <= today);
  const future = events.filter((e) => e.future || e.date > today);

  const byYear = new Map<number, TimelineEvent[]>();
  for (const e of past) {
    const year = Math.floor(e.dayNumber / 365);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(e);
  }

  const chapters: JourneyChapter[] = [];
  const years = [...byYear.keys()].sort((a, b) => a - b);
  for (const year of years) {
    const evs = byYear.get(year)!.sort((a, b) => a.date.localeCompare(b.date));
    const theme = chapterTheme(evs, year === years[0]);
    chapters.push({
      id: `chapter-y${year}`,
      act: `Year ${ordinalWord(year + 1)}`,
      title: theme.title,
      subtitle: theme.subtitle,
      startDay: evs[0].dayNumber,
      endDay: evs[evs.length - 1].dayNumber,
      startDate: evs[0].date,
      endDate: evs[evs.length - 1].date,
      events: evs,
    });
  }

  if (future.length) {
    const evs = future.sort((a, b) => a.date.localeCompare(b.date));
    chapters.push({
      id: "chapter-ahead",
      act: "The Road Ahead",
      title: "Yet to be written",
      subtitle: "The checkpoints still in front — where the story is heading.",
      startDay: evs[0].dayNumber,
      endDay: evs[evs.length - 1].dayNumber,
      startDate: evs[0].date,
      endDate: evs[evs.length - 1].date,
      future: true,
      events: evs,
    });
  }

  return chapters;
}

/* ════════════════════════════════════════════════════════════════
   Documentary narration — the opening voiceover
   ════════════════════════════════════════════════════════════════ */

export function legacyNarration(stats: LegacyStats, profile: Profile): string {
  const parts = [
    `${commas(stats.journeyDays)} days ago, a decision was made.`,
    `Since then: ${commas(stats.totalHours)} hours at the desk across ${commas(
      stats.studyDays,
    )} days of showing up, ${stats.mocksTaken} mocks, ${stats.booksCompleted} books closed, ${stats.topicsMastered} topics committed to memory.`,
    stats.attempts > 1
      ? `Through ${stats.attempts} attempts, one aim held steady — ${profile.mission ?? profile.targetExam}.`
      : `One aim, held steady — ${profile.mission ?? profile.targetExam}.`,
    `This is that story, recorded as it happened.`,
  ];
  return parts.join(" ");
}
