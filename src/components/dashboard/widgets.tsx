"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Clock,
  CalendarCheck,
  Smile,
  ArrowUpRight,
  Repeat,
  Target,
  Sparkles,
  TrendingUp,
  Milestone as MilestoneIcon,
} from "lucide-react";
import { useChronicle } from "@/lib/store";
import {
  buildHeatmap,
  currentStreak,
  longestStreak,
  totalHours,
  studyDays,
  lastNDaysHours,
  hoursBySubject,
  avgMood,
  mockSeries,
  todayEntry,
} from "@/lib/selectors";
import {
  toISODate,
  daysBetween,
  formatHours,
  formatDate,
  weekday,
  relativeDay,
} from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { RadialProgress, Progress } from "@/components/ui/progress";
import { Heatmap } from "@/components/charts/heatmap";
import { BarChart } from "@/components/charts/bar-chart";
import { Donut } from "@/components/charts/donut";
import { Sparkline } from "@/components/charts/sparkline";

const MOOD = ["", "Drained", "Low", "Steady", "Good", "In flow"];
const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "The scoreboard is quiet on the days that matter most.",
  "Slow is smooth, smooth is fast.",
  "You are not behind. You are exactly one focused day ahead of yesterday.",
  "Revision is where the exam is actually won.",
  "Show up. The mood will follow the motion.",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

/* ── Greeting hero ───────────────────────────────────────────── */

export function GreetingHero() {
  const profile = useChronicle((s) => s.profile);
  const journal = useChronicle((s) => s.journal);
  const today = toISODate(new Date());
  const daysLeft = daysBetween(today, profile.examDate);
  const journeyDay = daysBetween(profile.startDate, today);
  const streak = currentStreak(journal);
  const firstName = profile.name.split(" ")[0];
  const quote = QUOTES[journeyDay % QUOTES.length];

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-accent/[0.08] blur-2xl" />
      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="min-w-0">
          <p className="eyebrow mb-3">
            Day {journeyDay} of the journey · {profile.targetExam}
          </p>
          <h1 className="font-display text-3xl font-light tracking-tight text-paper sm:text-[2.5rem]">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-3 max-w-md text-sm italic leading-relaxed text-paper/45">
            “{quote}”
          </p>
          {profile.mission && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-paper/10 bg-paper/[0.03] px-3 py-1 text-xs text-paper/60">
              <Target className="h-3.5 w-3.5" />
              <span className="text-paper/45">Mission</span> {profile.mission}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href="/journal?new=1"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-soft transition-all hover:-translate-y-px hover:opacity-90"
            >
              Log today
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/10 bg-paper/[0.03] px-3 py-2 text-sm text-paper/60">
              <Flame className="h-4 w-4" />
              {streak}-day streak
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <RadialProgress
            value={Math.max(0, Math.min(100, ((560 - daysLeft) / 560) * 100))}
            size={120}
            stroke={7}
            label={<span className="text-2xl">{daysLeft}</span>}
            sublabel="days left"
          />
        </div>
      </div>
    </Card>
  );
}

/* ── Stat strip ──────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  delay = 0,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  hint?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card hover className="h-full p-5">
        <div className="flex items-center gap-2 text-paper/40">
          <Icon className="h-4 w-4" />
          <span className="text-[0.7rem] font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="tabular mt-3 text-3xl font-semibold tracking-tight text-paper">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-paper/40">{hint}</p>}
      </Card>
    </motion.div>
  );
}

export function StatStrip() {
  const journal = useChronicle((s) => s.journal);
  const streak = currentStreak(journal);
  const longest = longestStreak(journal);
  const total = totalHours(journal);
  const days = studyDays(journal);
  const mood = avgMood(journal, 14);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={Flame} label="Current streak" value={`${streak}d`} hint={`Best: ${longest} days`} delay={0.02} />
      <StatCard icon={Clock} label="Total hours" value={`${total}h`} hint="Since day one" delay={0.06} />
      <StatCard icon={CalendarCheck} label="Days studied" value={`${days}`} hint="Logged sessions" delay={0.1} />
      <StatCard icon={Smile} label="Avg mood" value={mood ? `${mood}/5` : "—"} hint={mood ? MOOD[Math.round(mood)] : "No data"} delay={0.14} />
    </div>
  );
}

/* ── Heatmap card ────────────────────────────────────────────── */

export function HeatmapCard() {
  const journal = useChronicle((s) => s.journal);
  const cells = buildHeatmap(journal, 364);
  const yearHours = Math.round(cells.reduce((a, c) => a + c.hours, 0));
  const activeDays = cells.filter((c) => c.hours > 0).length;

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">Consistency</p>
          <h3 className="text-base font-semibold text-paper">Study heatmap</h3>
        </div>
        <Link
          href="/heatmap"
          className="text-xs text-paper/45 transition-colors hover:text-paper"
        >
          Full view →
        </Link>
      </div>
      <Heatmap cells={cells} />
      <div className="mt-4 flex gap-6 border-t border-paper/[0.06] pt-4 text-sm">
        <div>
          <span className="tabular font-semibold text-paper">{yearHours}h</span>
          <span className="ml-1.5 text-paper/40">this year</span>
        </div>
        <div>
          <span className="tabular font-semibold text-paper">{activeDays}</span>
          <span className="ml-1.5 text-paper/40">active days</span>
        </div>
      </div>
    </Card>
  );
}

/* ── 14-day trend ────────────────────────────────────────────── */

export function TrendCard() {
  const journal = useChronicle((s) => s.journal);
  const target = useChronicle((s) => s.profile.dailyHourTarget);
  const days = lastNDaysHours(journal, 14);
  const data = days.map((d) => ({
    label: weekday(d.date).slice(0, 1),
    value: Math.round(d.hours * 10) / 10,
    sublabel: formatDate(d.date),
  }));

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">Last 14 days</p>
          <h3 className="text-base font-semibold text-paper">Hours per day</h3>
        </div>
        <span className="text-xs text-paper/40">goal {target}h/day</span>
      </div>
      <BarChart data={data} target={target} formatValue={(v) => `${v}h`} height={170} />
    </Card>
  );
}

/* ── Today snapshot ──────────────────────────────────────────── */

export function TodayCard() {
  const journal = useChronicle((s) => s.journal);
  const subjects = useChronicle((s) => s.subjects);
  const entry = todayEntry(journal);

  if (!entry) {
    return (
      <Card className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper/[0.06] text-paper/50">
          <Clock className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-paper">Today is a blank page</p>
        <p className="mt-1 text-xs text-paper/45">
          Log your first session to keep the streak alive.
        </p>
        <Link
          href="/journal?new=1"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-soft hover:opacity-90"
        >
          Start today’s entry
        </Link>
      </Card>
    );
  }

  const name = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Today</p>
          <h3 className="text-base font-semibold text-paper">
            {formatHours(entry.totalHours)} logged
          </h3>
        </div>
        <Link href="/journal" className="text-xs text-paper/45 hover:text-paper">
          Edit →
        </Link>
      </div>
      <div className="space-y-2">
        {entry.blocks.map((b, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-sm text-paper/70">
              {name(b.subjectId)}
            </span>
            <Progress value={(b.hours / entry.totalHours) * 100} className="w-20" />
            <span className="tabular w-12 text-right text-xs text-paper/50">
              {formatHours(b.hours)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2 border-t border-paper/[0.06] pt-4 text-xs text-paper/50">
        <span className="rounded-full bg-paper/[0.05] px-2.5 py-1">
          Mood {MOOD[entry.mood]}
        </span>
        <span className="rounded-full bg-paper/[0.05] px-2.5 py-1">
          Focus {entry.focus}/5
        </span>
      </div>
    </Card>
  );
}

/* ── Subject focus donut ─────────────────────────────────────── */

export function FocusDonut() {
  const journal = useChronicle((s) => s.journal);
  const subjects = useChronicle((s) => s.subjects);
  const data = hoursBySubject(journal, subjects, 30)
    .filter((s) => s.hours > 0)
    .slice(0, 6)
    .map((s) => ({ label: s.name, value: s.hours }));
  const total = Math.round(data.reduce((a, s) => a + s.value, 0));

  return (
    <Card className="p-6">
      <div className="mb-5">
        <p className="eyebrow mb-1">Last 30 days</p>
        <h3 className="text-base font-semibold text-paper">Where the hours went</h3>
      </div>
      <Donut
        segments={data}
        size={140}
        thickness={16}
        centerLabel={`${total}h`}
        centerSub="total"
      />
    </Card>
  );
}

/* ── Revision due ────────────────────────────────────────────── */

export function RevisionDueCard() {
  const revisions = useChronicle((s) => s.revisions);
  const subjects = useChronicle((s) => s.subjects);
  const today = toISODate(new Date());
  const due = revisions
    .filter((r) => r.nextDue <= today)
    .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
    .slice(0, 4);
  const name = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-paper/45" />
          <h3 className="text-base font-semibold text-paper">Due for revision</h3>
        </div>
        <Link href="/revision" className="text-xs text-paper/45 hover:text-paper">
          All →
        </Link>
      </div>
      {due.length === 0 ? (
        <p className="py-4 text-sm text-paper/40">All caught up. Nothing due today.</p>
      ) : (
        <ul className="space-y-2.5">
          {due.map((r) => (
            <li key={r.id} className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-paper/[0.05] text-[0.6rem] font-semibold text-paper/60">
                R{r.repetitions}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-paper/80">{r.topic}</p>
                <p className="truncate text-[0.7rem] text-paper/40">{name(r.subjectId)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-paper/10 px-2 py-0.5 text-[0.6rem] text-paper/60">
                due
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ── Mock momentum ───────────────────────────────────────────── */

export function MockMomentumCard() {
  const mocks = useChronicle((s) => s.mocks);
  const series = mockSeries(mocks, "Prelims GS");
  const values = series.map((s) => s.pct);
  const latest = series[series.length - 1];
  const prev = series[series.length - 2];
  const delta = latest && prev ? latest.pct - prev.pct : 0;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-paper/45" />
          <h3 className="text-base font-semibold text-paper">Mock momentum</h3>
        </div>
        <Link href="/mocks" className="text-xs text-paper/45 hover:text-paper">
          Analytics →
        </Link>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="tabular text-3xl font-semibold text-paper">
            {latest ? `${latest.pct}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-paper/40">
            latest Prelims GS{" "}
            {delta !== 0 && (
              <span className={delta > 0 ? "text-paper/70" : "text-paper/40"}>
                ({delta > 0 ? "+" : ""}
                {delta}%)
              </span>
            )}
          </p>
        </div>
        <Sparkline values={values} width={140} height={48} />
      </div>
    </Card>
  );
}

/* ── Goals progress ──────────────────────────────────────────── */

export function GoalsCard() {
  const goals = useChronicle((s) => s.goals);
  const active = goals
    .filter((g) => g.status === "Active" && g.target)
    .slice(0, 4);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-paper/45" />
          <h3 className="text-base font-semibold text-paper">Goals in motion</h3>
        </div>
        <Link href="/goals" className="text-xs text-paper/45 hover:text-paper">
          All →
        </Link>
      </div>
      <ul className="space-y-3.5">
        {active.map((g) => {
          const pct = Math.round(((g.current ?? 0) / (g.target ?? 1)) * 100);
          return (
            <li key={g.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm text-paper/75">{g.title}</span>
                <span className="tabular shrink-0 text-xs text-paper/45">
                  {g.current}/{g.target} {g.unit}
                </span>
              </div>
              <Progress value={pct} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ── Recent milestones mini ──────────────────────────────────── */

export function MilestonesMini() {
  const milestones = useChronicle((s) => s.milestones);
  const today = toISODate(new Date());
  const recent = milestones
    .filter((m) => m.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MilestoneIcon className="h-4 w-4 text-paper/45" />
          <h3 className="text-base font-semibold text-paper">Recent milestones</h3>
        </div>
        <Link href="/timeline" className="text-xs text-paper/45 hover:text-paper">
          Timeline →
        </Link>
      </div>
      <ol className="relative space-y-4 border-l border-paper/10 pl-4">
        {recent.map((m) => (
          <li key={m.id} className="relative">
            <span className="absolute -left-[1.32rem] top-1 h-2 w-2 rounded-full bg-paper" />
            <p className="text-sm font-medium text-paper">{m.title}</p>
            <p className="text-[0.7rem] text-paper/40">{relativeDay(m.date, today)}</p>
            {m.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-paper/50">{m.description}</p>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ── Coach nudge ─────────────────────────────────────────────── */

export function CoachNudge() {
  const journal = useChronicle((s) => s.journal);
  const subjects = useChronicle((s) => s.subjects);
  const bySub = hoursBySubject(journal, subjects, 14);
  const neglected = [...bySub].reverse().find((s) => s.hours < 1);
  const top = bySub[0];

  const insight = neglected
    ? `${neglected.name} hasn't seen much time in the last two weeks. A short revision block could keep it warm.`
    : top
      ? `${top.name} is your anchor subject lately. Consider rotating in a weaker area to balance the syllabus.`
      : "Log a few days to unlock personalised coaching insights.";

  return (
    <Card className="relative overflow-hidden p-6">
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-accent/[0.07] blur-2xl" />
      <div className="relative flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg shadow-soft">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-paper">Coach’s read</h3>
            <span className="rounded-full border border-paper/10 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-wider text-paper/40">
              AI
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-paper/55">{insight}</p>
          <Link
            href="/coach"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-paper/70 hover:text-paper"
          >
            Talk to your coach <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
