"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Flame,
  TrendingUp,
  TrendingDown,
  Layers,
  Target,
  Repeat,
  Clock,
  HeartPulse,
  TriangleAlert,
  Minus,
  BookOpen,
  Newspaper,
  PenLine,
  Coffee,
  Moon,
  CalendarDays,
  Gauge,
  FileText,
  ChevronRight,
  ClipboardList,
  Brain,
  type LucideIcon,
} from "lucide-react";
import { useChronicle, useHasHydrated } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { Loading } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { Sparkline } from "@/components/charts/sparkline";
import {
  buildMentorContext,
  mentorBriefing,
  recommendDailySchedule,
  suggestRevisionPlan,
  buildWeeklyReport,
  buildMonthlyReport,
  mentorReply,
  composeMentorPrompt,
  MENTOR_SYSTEM_PROMPT,
  type MentorContext,
  type Risk,
  type RiskSeverity,
  type ScheduleBlock,
  type RevisionPlan,
  type MentorReport,
  type ComposedPrompt,
  type ChatTurn,
} from "@/lib/mentor";
import type { ChronicleData } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

/* ── icon + severity maps ─────────────────────────────────────── */

const RISK_ICONS: Record<string, LucideIcon> = {
  Layers,
  Target,
  TrendingDown,
  Repeat,
  Flame,
  Clock,
  HeartPulse,
  TriangleAlert,
  Minus,
};

const KIND_ICONS: Record<ScheduleBlock["kind"], LucideIcon> = {
  deep: BookOpen,
  "current-affairs": Newspaper,
  revision: Repeat,
  mistakes: TriangleAlert,
  mock: Target,
  "answer-writing": PenLine,
  break: Coffee,
  wellbeing: Moon,
};

const SEV: Record<
  RiskSeverity,
  { bar: string; badge: "danger" | "warning" | "accent"; label: string }
> = {
  critical: { bar: "bg-danger", badge: "danger", label: "Critical" },
  elevated: { bar: "bg-warning", badge: "warning", label: "Elevated" },
  watch: { bar: "bg-info/70", badge: "accent", label: "Watch" },
};

type Tab = "briefing" | "plan" | "reports" | "talk";

const TABS: { label: string; value: Tab }[] = [
  { label: "Briefing", value: "briefing" },
  { label: "Today's plan", value: "plan" },
  { label: "Reports", value: "reports" },
  { label: "Talk to mentor", value: "talk" },
];

export default function CoachPage() {
  const hydrated = useHasHydrated();
  const data = useChronicle((s) => s);
  const [tab, setTab] = useState<Tab>("briefing");

  const ctx = useMemo(() => buildMentorContext(data), [data]);
  const briefing = useMemo(() => mentorBriefing(ctx), [ctx]);

  if (!hydrated) return <Loading />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI UPSC Mentor"
        title="A mentor who has read every page of your journal."
        description="Not a chatbot — a mentor. It reads your hours, mocks, coverage, revision, mistakes and mood, then tells you the truth and what to do next."
      />

      {/* Mentor briefing */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
          <div className="flex items-center gap-3 sm:flex-col sm:items-start">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-fg shadow-soft">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="sm:mt-1">
              <p className="text-sm font-semibold text-paper">Arav</p>
              <p className="text-[0.7rem] text-paper/40">Your mentor</p>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-medium uppercase tracking-wider text-paper/40">
              Today&apos;s read on you
            </p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-paper/80">
              {briefing}
            </p>
          </div>
          <div className="hidden shrink-0 flex-col items-end justify-center lg:flex">
            <span className="text-[0.65rem] font-medium uppercase tracking-wider text-paper/40">
              14-day momentum
            </span>
            <Sparkline values={ctx.study.spark14} width={150} height={40} className="mt-1.5" />
          </div>
        </div>
        <SignalRow ctx={ctx} />
      </Card>

      <Segmented value={tab} onChange={(v) => setTab(v as Tab)} options={TABS} />

      {tab === "briefing" && <BriefingView ctx={ctx} />}
      {tab === "plan" && <PlanView ctx={ctx} data={data} />}
      {tab === "reports" && <ReportsView ctx={ctx} data={data} />}
      {tab === "talk" && <TalkView ctx={ctx} data={data} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SIGNAL ROW — the key numbers the mentor is reading
   ════════════════════════════════════════════════════════════════ */

function SignalRow({ ctx }: { ctx: MentorContext }) {
  const TrendIcon =
    ctx.mocks.direction === "up"
      ? TrendingUp
      : ctx.mocks.direction === "down"
        ? TrendingDown
        : Minus;
  const signals: {
    icon: LucideIcon;
    label: string;
    value: string;
    hint?: string;
  }[] = [
    {
      icon: CalendarDays,
      label: "To exam",
      value: `${ctx.examDaysLeft}d`,
      hint: ctx.profile.targetExam,
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${ctx.study.streak}d`,
      hint: `${ctx.study.last7PerDay}h/day`,
    },
    {
      icon: Gauge,
      label: "Readiness",
      value: `${ctx.coverage.weightedReadiness}%`,
      hint: "weighted",
    },
    {
      icon: TrendIcon,
      label: "Mock avg",
      value: ctx.mocks.recentAvgPct != null ? `${ctx.mocks.recentAvgPct}%` : "–",
      hint: ctx.mocks.delta ? `${ctx.mocks.delta > 0 ? "+" : ""}${ctx.mocks.delta}%` : "steady",
    },
    {
      icon: Repeat,
      label: "Revision due",
      value: `${ctx.revision.due}`,
      hint: ctx.revision.overdue ? `${ctx.revision.overdue} overdue` : "on track",
    },
    {
      icon: HeartPulse,
      label: "Mood",
      value: `${ctx.mind.avgMood}/5`,
      hint: `sleep ${ctx.mind.avgSleep}h`,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden border-t border-paper/[0.06] bg-paper/[0.04] sm:grid-cols-3 lg:grid-cols-6">
      {signals.map((s) => (
        <div key={s.label} className="bg-ink p-4">
          <div className="flex items-center gap-1.5 text-paper/40">
            <s.icon className="h-3.5 w-3.5" />
            <span className="text-[0.65rem] font-medium uppercase tracking-wider">
              {s.label}
            </span>
          </div>
          <p className="tabular mt-1.5 text-xl font-semibold text-paper">
            {s.value}
          </p>
          {s.hint && <p className="text-[0.7rem] text-paper/40">{s.hint}</p>}
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BRIEFING VIEW — risk radar + weak subjects (the diagnosis)
   ════════════════════════════════════════════════════════════════ */

function BriefingView({ ctx }: { ctx: MentorContext }) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Risk radar */}
      <section className="space-y-3 lg:col-span-3">
        <SectionTitle
          icon={TriangleAlert}
          title="Preparation risk radar"
          sub={`${ctx.risks.length} signal${ctx.risks.length === 1 ? "" : "s"} the mentor is tracking`}
        />
        {ctx.risks.length === 0 ? (
          <Card className="p-6 text-sm text-paper/60">
            No material risks right now. Keep the system running — consistency is
            doing the heavy lifting.
          </Card>
        ) : (
          <div className="space-y-3">
            {ctx.risks.map((r) => (
              <RiskCard key={r.id} risk={r} />
            ))}
          </div>
        )}
      </section>

      {/* Weak subjects */}
      <section className="space-y-3 lg:col-span-2">
        <SectionTitle
          icon={Layers}
          title="Weak subjects"
          sub="Fused from mastery, mocks, time & mistakes"
        />
        <Card className="divide-y divide-paper/[0.06]">
          {ctx.weakSubjects.slice(0, 6).map((w, i) => (
            <div key={w.subjectId} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="tabular text-xs text-paper/35">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate text-sm font-medium text-paper">
                    {w.name}
                  </span>
                </div>
                <Badge tone={i < 2 ? "solid" : "outline"}>{w.score}</Badge>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <Progress value={w.mastery} className="h-1" />
                <span className="tabular shrink-0 text-[0.7rem] text-paper/45">
                  {w.mastery}%
                </span>
              </div>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-paper/50">
                {w.reasons.slice(0, 2).join(" · ")}
              </p>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

function RiskCard({ risk }: { risk: Risk }) {
  const Icon = RISK_ICONS[risk.icon] ?? TriangleAlert;
  const sev = SEV[risk.severity];
  return (
    <Card className="relative overflow-hidden">
      <span className={cn("absolute inset-y-0 left-0 w-1", sev.bar)} />
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-paper/[0.06] text-paper/70">
              <Icon className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold text-paper">{risk.title}</h3>
          </div>
          <Badge tone={sev.badge}>{sev.label}</Badge>
        </div>
        <p className="mt-3 text-[0.8rem] leading-relaxed text-paper/65">
          {risk.evidence}
        </p>
        <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-paper/[0.04] px-3 py-2">
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-paper/40" />
          <p className="text-[0.8rem] leading-relaxed text-paper/75">
            {risk.mitigation}
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════
   PLAN VIEW — today's schedule + 7-day revision plan
   ════════════════════════════════════════════════════════════════ */

function PlanView({ ctx, data }: { ctx: MentorContext; data: ChronicleData }) {
  const plan = useMemo(() => recommendDailySchedule(ctx), [ctx]);
  const revision = useMemo(() => suggestRevisionPlan(data, ctx), [data, ctx]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Schedule */}
      <section className="space-y-3 lg:col-span-3">
        <SectionTitle
          icon={Clock}
          title="Today's recommended schedule"
          sub={plan.note}
        />
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-paper/60">
              <span className="tabular text-lg font-semibold text-paper">
                {plan.studyHours}h
              </span>
              <span className="text-paper/40">
                focused · target {plan.targetHours}h
              </span>
            </div>
            <Progress
              value={(plan.studyHours / plan.targetHours) * 100}
              className="h-1.5 w-28"
            />
          </div>
          <ol className="relative space-y-1 border-l border-paper/10 pl-0">
            {plan.blocks.map((b, i) => (
              <ScheduleRow key={i} block={b} />
            ))}
          </ol>
        </Card>
      </section>

      {/* Revision plan */}
      <section className="space-y-3 lg:col-span-2">
        <SectionTitle
          icon={Repeat}
          title="7-day revision plan"
          sub={revision.summary}
        />
        <RevisionPlanView plan={revision} />
      </section>
    </div>
  );
}

function ScheduleRow({ block }: { block: ScheduleBlock }) {
  const Icon = KIND_ICONS[block.kind];
  const isBreak = block.kind === "break" || block.kind === "wellbeing";
  return (
    <li className="relative pl-6">
      <span
        className={cn(
          "absolute left-0 top-3 -ml-[5px] h-2.5 w-2.5 rounded-full border-2 border-ink",
          isBreak ? "bg-paper/25" : "bg-paper",
        )}
      />
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl px-3 py-2.5",
          isBreak ? "opacity-60" : "bg-paper/[0.03]",
        )}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper/[0.06] text-paper/70">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-paper">
              {block.title}
            </p>
            <span className="tabular shrink-0 text-[0.7rem] text-paper/45">
              {block.start}–{block.end}
            </span>
          </div>
          <p className="mt-0.5 text-[0.72rem] leading-relaxed text-paper/50">
            {block.rationale}
          </p>
        </div>
      </div>
    </li>
  );
}

function RevisionPlanView({ plan }: { plan: RevisionPlan }) {
  const KIND_BADGE: Record<string, string> = {
    overdue: "Overdue",
    due: "Due",
    weak: "Weak",
    mistake: "Mistake",
  };
  return (
    <div className="space-y-2.5">
      {plan.days.map((day) => (
        <Card key={day.date} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-paper">{day.label}</span>
              <span className="text-[0.7rem] text-paper/35">
                {formatDate(day.date)}
              </span>
            </div>
            <Badge tone={day.load === "heavy" ? "solid" : "ghost"}>
              {day.load}
            </Badge>
          </div>
          {day.items.length === 0 ? (
            <p className="mt-2 text-xs text-paper/40">Rest / buffer day.</p>
          ) : (
            <ul className="mt-2.5 space-y-1.5">
              {day.items.map((it, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-paper/40" />
                  <div className="min-w-0">
                    <p className="text-[0.8rem] text-paper/75">
                      <span className="text-paper/45">{it.subject}:</span>{" "}
                      {it.topic}{" "}
                      <span className="text-[0.66rem] text-paper/35">
                        · {KIND_BADGE[it.kind]}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   REPORTS VIEW — weekly / monthly retrospectives
   ════════════════════════════════════════════════════════════════ */

function ReportsView({
  ctx,
  data,
}: {
  ctx: MentorContext;
  data: ChronicleData;
}) {
  const [kind, setKind] = useState<"weekly" | "monthly">("weekly");
  const report = useMemo<MentorReport>(
    () => (kind === "weekly" ? buildWeeklyReport(data, ctx) : buildMonthlyReport(data, ctx)),
    [kind, data, ctx],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Segmented
          value={kind}
          onChange={(v) => setKind(v as "weekly" | "monthly")}
          options={[
            { label: "Weekly", value: "weekly" },
            { label: "Monthly", value: "monthly" },
          ]}
        />
        <span className="text-xs text-paper/40">{report.periodLabel}</span>
      </div>

      <Card className="p-6">
        {/* headline + grade */}
        <div className="flex items-start justify-between gap-4 border-b border-paper/[0.06] pb-5">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-medium uppercase tracking-wider text-paper/40">
              Mentor&apos;s verdict
            </p>
            <p className="mt-1.5 text-lg font-medium leading-snug text-paper">
              {report.headline}
            </p>
          </div>
          <div className="grid shrink-0 place-items-center">
            <span className="font-display text-4xl font-light text-paper">
              {report.grade}
            </span>
            <span className="tabular text-[0.7rem] text-paper/40">
              {report.score}/100
            </span>
          </div>
        </div>

        {/* metrics */}
        <div className="grid grid-cols-2 gap-4 border-b border-paper/[0.06] py-5 sm:grid-cols-3 lg:grid-cols-6">
          {report.metrics.map((m) => (
            <div key={m.label}>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-paper/40">
                {m.label}
              </p>
              <p className="tabular mt-1 text-lg font-semibold text-paper">
                {m.value}
              </p>
              {m.delta && (
                <p
                  className={cn(
                    "text-[0.7rem]",
                    m.good ? "text-paper/70" : "text-paper/40",
                  )}
                >
                  {m.delta}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* sections */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {report.sections.map((sec) => (
            <div key={sec.heading}>
              <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-wider text-paper/45">
                {sec.heading}
              </p>
              <ul className="space-y-1.5">
                {sec.lines.map((line, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-[0.82rem] leading-relaxed text-paper/65"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-paper/40" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TALK VIEW — conversation + prompt-architecture transparency
   ════════════════════════════════════════════════════════════════ */

const SUGGESTIONS = [
  "What's my plan for today?",
  "Which subjects am I weakest in?",
  "Am I at risk anywhere?",
  "How are my mocks trending?",
  "What should I revise this week?",
  "Am I on pace for the exam?",
  "I'm feeling burnt out.",
];

function TalkView({
  ctx,
  data,
}: {
  ctx: MentorContext;
  data: ChronicleData;
}) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<ComposedPrompt | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function send(prompt: string) {
    const text = prompt.trim();
    if (!text || typing) return;
    const history = messages;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setLastPrompt(composeMentorPrompt(ctx, text, history));
    const answer = mentorReply(ctx, data, text);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "coach", text: answer }]);
      setTyping(false);
    }, 550);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  const previewPrompt = lastPrompt ?? composeMentorPrompt(ctx, input || "How am I doing?", messages);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle
          icon={Sparkles}
          title="Talk to your mentor"
          sub="Every answer is computed from your live Chronicle data"
        />
        <button
          onClick={() => setPromptOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-paper/12 px-3 py-1.5 text-xs text-paper/60 transition-colors hover:border-paper/25 hover:text-paper"
        >
          <FileText className="h-3.5 w-3.5" />
          View the prompt
        </button>
      </div>

      <Card className="flex h-[520px] flex-col overflow-hidden">
        <div
          ref={scrollRef}
          className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-6"
        >
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-fg shadow-soft">
                <Sparkles className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-medium text-paper">
                Ask your mentor anything
              </p>
              <p className="mt-1 max-w-xs text-xs text-paper/45">
                Plan, weak areas, mocks, revision, risks, pace, or just
                &ldquo;how am I doing?&rdquo;
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {m.role === "coach" && (
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-paper text-ink"
                    : "border border-paper/10 bg-paper/[0.03] text-paper/80",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="flex items-center gap-1 rounded-2xl border border-paper/10 bg-paper/[0.03] px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper/50"
                    style={{ animationDelay: `${d * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* suggestions */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-paper/[0.06] px-4 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 rounded-full border border-paper/12 px-3 py-1.5 text-xs text-paper/60 transition-colors hover:border-paper/25 hover:text-paper"
            >
              {s}
            </button>
          ))}
        </div>

        {/* input */}
        <div className="flex items-center gap-2 border-t border-paper/[0.08] p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask about your preparation…"
            className="h-11 flex-1 rounded-xl border border-paper/10 bg-paper/[0.03] px-4 text-sm text-paper placeholder:text-paper/35 focus:border-paper/25 focus:outline-none"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </Card>

      <PromptModal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        prompt={previewPrompt}
      />
    </div>
  );
}

/* ── prompt architecture viewer ───────────────────────────────── */

function PromptModal({
  open,
  onClose,
  prompt,
}: {
  open: boolean;
  onClose: () => void;
  prompt: ComposedPrompt;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Prompt architecture"
      description="Exactly what would be sent to the language model"
      className="sm:max-w-2xl"
    >
      <div className="space-y-5">
        <PromptBlock
          icon={Brain}
          label="System — the mentor persona"
          body={MENTOR_SYSTEM_PROMPT}
        />
        <PromptBlock
          icon={ClipboardList}
          label="Context — live Chronicle snapshot"
          body={prompt.context}
        />
        <PromptBlock
          icon={Sparkles}
          label="Aspirant message"
          body={prompt.user}
        />
        <p className="text-[0.72rem] leading-relaxed text-paper/45">
          The deterministic engine answers locally from this same snapshot, so
          swapping in a real model changes the voice — not the substance.
        </p>
      </div>
    </Modal>
  );
}

function PromptBlock({
  icon: Icon,
  label,
  body,
}: {
  icon: LucideIcon;
  label: string;
  body: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-paper/55">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[0.7rem] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <pre className="no-scrollbar overflow-x-auto whitespace-pre-wrap rounded-xl border border-paper/[0.08] bg-paper/[0.03] p-4 font-mono text-[0.72rem] leading-relaxed text-paper/70">
        {body}
      </pre>
    </div>
  );
}

/* ── small shared bits ────────────────────────────────────────── */

function SectionTitle({
  icon: Icon,
  title,
  sub,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-paper/[0.06] text-paper/60">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-snugg text-paper">
          {title}
        </h2>
        {sub && <p className="mt-0.5 text-xs leading-relaxed text-paper/45">{sub}</p>}
      </div>
    </div>
  );
}
