"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Pin,
  Sparkles,
  // event icons
  Sunrise,
  Clock,
  Target,
  TrendingUp,
  Trophy,
  BookCheck,
  GraduationCap,
  Repeat,
  FileCheck2,
  PenLine,
  Mic,
  Award,
  CalendarClock,
  Layers,
  Heart,
  TriangleAlert,
  Flag,
  type LucideIcon,
} from "lucide-react";
import { useChronicle, useHasHydrated } from "@/lib/store";
import type { Milestone, MilestoneType } from "@/lib/types";
import {
  buildTimeline,
  buildLegacyStats,
  groupIntoChapters,
  legacyNarration,
  type TimelineEvent,
  type EventCategory,
} from "@/lib/legacy";
import { PageHeader } from "@/components/ui/page-header";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea, Select } from "@/components/ui/form";
import { Chip } from "@/components/ui/misc";
import { toISODate, formatDate, uid, cn } from "@/lib/utils";

/* ── icon resolution for auto-generated events ── */
const ICONS: Record<string, LucideIcon> = {
  Sunrise,
  Clock,
  Target,
  TrendingUp,
  Trophy,
  BookCheck,
  GraduationCap,
  Repeat,
  FileCheck2,
  PenLine,
  Mic,
  Award,
  CalendarClock,
  Layers,
  Heart,
  TriangleAlert,
  Flag,
};

const SOURCE_LABEL: Record<TimelineEvent["source"], string> = {
  auto: "auto-recorded",
  selection: "selection journey",
  manual: "your note",
};

const TYPES: MilestoneType[] = [
  "Start",
  "Exam",
  "Achievement",
  "Phase",
  "Personal",
  "Setback",
  "Selection",
];

function emptyMilestone(): Milestone {
  return {
    id: uid("ms"),
    date: toISODate(new Date()),
    title: "",
    type: "Achievement",
    description: "",
  };
}

export default function TimelinePage() {
  const hydrated = useHasHydrated();
  const data = useChronicle((s) => s);
  const upsert = useChronicle((s) => s.upsertMilestone);
  const remove = useChronicle((s) => s.deleteMilestone);

  const today = toISODate(new Date());
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Milestone>(emptyMilestone());
  const [definingOnly, setDefiningOnly] = useState(false);
  const [muted, setMuted] = useState<Set<EventCategory>>(new Set());

  const allEvents = useMemo(() => buildTimeline(data, today), [data, today]);
  const stats = useMemo(
    () => buildLegacyStats(data, allEvents, today),
    [data, allEvents, today],
  );
  const narration = useMemo(
    () => legacyNarration(stats, data.profile),
    [stats, data.profile],
  );

  const presentCats = useMemo(() => {
    const order: EventCategory[] = [
      "Origin",
      "Study",
      "Mock",
      "Book",
      "Subject",
      "Revision",
      "Exam",
      "Result",
      "Milestone",
      "Setback",
      "Personal",
    ];
    const present = new Set(allEvents.map((e) => e.category));
    return order.filter((c) => present.has(c));
  }, [allEvents]);

  const filtered = useMemo(
    () =>
      allEvents.filter(
        (e) =>
          !muted.has(e.category) && (!definingOnly || e.importance >= 4),
      ),
    [allEvents, muted, definingOnly],
  );

  const chapters = useMemo(
    () => groupIntoChapters(filtered, today),
    [filtered, today],
  );

  if (!hydrated) return <Loading />;

  function toggleCat(c: EventCategory) {
    setMuted((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Timeline & Legacy"
        title="The documentary of a journey."
        description="Every defining moment, recorded as it happened — Day Zero to the name in the list. Most of this wrote itself: the system watches your hours, mocks, books and exams, and remembers them for you."
        actions={
          <Button
            onClick={() => {
              setDraft(emptyMilestone());
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add memory
          </Button>
        }
      />

      <LegacyHero narration={narration} stats={stats} />

      {/* Controls */}
      <div className="flex flex-col gap-3 border-y border-paper/[0.06] py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {presentCats.map((c) => (
            <Chip
              key={c}
              active={!muted.has(c)}
              onClick={() => toggleCat(c)}
            >
              {c}
            </Chip>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Chip active={!definingOnly} onClick={() => setDefiningOnly(false)}>
            All moments
          </Chip>
          <Chip active={definingOnly} onClick={() => setDefiningOnly(true)}>
            Defining only
          </Chip>
        </div>
      </div>

      {/* The documentary */}
      <div className="space-y-14">
        {chapters.map((ch, ci) => (
          <section key={ch.id}>
            <ChapterHeader chapter={ch} />
            <div className="relative mt-6 pl-1">
              <div
                className={cn(
                  "absolute bottom-3 left-[1.32rem] top-2",
                  ch.future
                    ? "w-0 border-l border-dashed border-paper/20"
                    : "w-px bg-gradient-to-b from-paper/25 via-paper/12 to-paper/[0.04]",
                )}
              />
              <ol className="space-y-5">
                {ch.events.map((e, i) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    index={ci === 0 ? i : 0}
                    onDelete={
                      e.refId ? () => remove(e.refId as string) : undefined
                    }
                  />
                ))}
              </ol>
            </div>
          </section>
        ))}
        {chapters.length === 0 && (
          <p className="py-10 text-center text-sm text-paper/40">
            No moments match this filter.
          </p>
        )}
      </div>

      <AddMemoryModal
        open={open}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setOpen(false)}
        onSave={() => {
          if (!draft.title.trim()) return;
          upsert(draft);
          setOpen(false);
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   LEGACY HERO — the journey in numbers + opening narration
   ════════════════════════════════════════════════════════════════ */

function LegacyHero({
  narration,
  stats,
}: {
  narration: string;
  stats: ReturnType<typeof buildLegacyStats>;
}) {
  const cells: { label: string; value: string; hint?: string }[] = [
    { label: "Journey day", value: `${stats.journeyDays}`, hint: "since Day Zero" },
    { label: "Hours logged", value: stats.totalHours.toLocaleString("en-IN"), hint: `${stats.studyDays} active days` },
    { label: "Mocks", value: `${stats.mocksTaken}`, hint: stats.bestMockPct != null ? `best ${stats.bestMockPct}%` : "—" },
    { label: "Books closed", value: `${stats.booksCompleted}`, hint: "standard texts" },
    { label: "Topics mastered", value: `${stats.topicsMastered}`, hint: `of ${stats.totalTopics}` },
    { label: "Current stage", value: stats.currentStage.split(" · ")[0], hint: stats.currentStage.split(" · ")[1] ?? "" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-paper/[0.08] bg-gradient-to-br from-paper/[0.05] to-transparent">
      <div className="flex items-start gap-3 p-6 sm:p-7">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-paper text-ink">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="eyebrow mb-2">Opening narration</p>
          <p className="max-w-3xl font-display text-lg font-light leading-relaxed text-paper/85 sm:text-xl">
            {narration}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-paper/[0.06] bg-paper/[0.04] sm:grid-cols-3 lg:grid-cols-6">
        {cells.map((c) => (
          <div key={c.label} className="bg-ink p-4">
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-paper/40">
              {c.label}
            </p>
            <p className="tabular mt-1.5 truncate text-xl font-semibold text-paper">
              {c.value}
            </p>
            {c.hint && <p className="truncate text-[0.7rem] text-paper/40">{c.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CHAPTER HEADER — the documentary "act" title card
   ════════════════════════════════════════════════════════════════ */

function ChapterHeader({
  chapter,
}: {
  chapter: ReturnType<typeof groupIntoChapters>[number];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-2 border-l-2 border-paper/20 pl-5 sm:pl-6"
    >
      <div className="flex items-center gap-3">
        <span className="eyebrow">{chapter.act}</span>
        <span className="h-px w-8 bg-paper/20" />
        <span className="text-[0.7rem] text-paper/35">
          {formatDate(chapter.startDate)} – {formatDate(chapter.endDate)}
        </span>
      </div>
      <h2
        className={cn(
          "font-display text-2xl font-light tracking-tight sm:text-[1.9rem]",
          chapter.future ? "text-paper/55" : "text-paper",
        )}
      >
        {chapter.title}
      </h2>
      <p className="max-w-2xl text-sm leading-relaxed text-paper/50">
        {chapter.subtitle}
      </p>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EVENT ROW — one recorded memory along the spine
   ════════════════════════════════════════════════════════════════ */

function EventRow({
  event,
  index,
  onDelete,
}: {
  event: TimelineEvent;
  index: number;
  onDelete?: () => void;
}) {
  const Icon = ICONS[event.icon] ?? Flag;
  const defining = event.importance >= 5;
  const strong = event.importance >= 4;

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4 }}
      className="group relative flex gap-4"
    >
      {/* node */}
      <span
        className={cn(
          "relative z-10 grid h-[2.45rem] w-[2.45rem] shrink-0 place-items-center rounded-full border transition-colors",
          event.future
            ? "border-dashed border-paper/25 bg-ink text-paper/40"
            : defining
              ? "border-transparent bg-paper text-ink shadow-soft"
              : strong
                ? "border-paper/20 bg-paper/[0.08] text-paper"
                : "border-paper/12 bg-paper/[0.04] text-paper/60",
        )}
      >
        <Icon className="h-[1.05rem] w-[1.05rem]" />
      </span>

      {/* card */}
      <div
        className={cn(
          "min-w-0 flex-1 rounded-2xl border p-4 transition-colors sm:p-5",
          event.future
            ? "border-dashed border-paper/12 bg-transparent"
            : "border-paper/[0.07] bg-paper/[0.02] group-hover:border-paper/15",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="tabular rounded-md bg-paper/[0.06] px-1.5 py-0.5 text-[0.62rem] font-medium text-paper/45">
            {event.future ? "—" : `DAY ${event.dayNumber}`}
          </span>
          <h3
            className={cn(
              "text-[0.98rem] font-semibold tracking-snugg",
              event.future ? "text-paper/60" : "text-paper",
            )}
          >
            {event.title}
          </h3>
          {event.pinned && <Pin className="h-3 w-3 text-paper/40" />}
          {event.future && <Badge tone="ghost">upcoming</Badge>}
        </div>

        <p className="mt-2 max-w-2xl text-[0.86rem] leading-relaxed text-paper/65">
          {event.narrative}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] text-paper/35">
          <span>{formatDate(event.date)}</span>
          {event.detail && (
            <>
              <span className="h-0.5 w-0.5 rounded-full bg-paper/30" />
              <span className="text-paper/45">{event.detail}</span>
            </>
          )}
          <span className="h-0.5 w-0.5 rounded-full bg-paper/30" />
          <span
            className={cn(
              "uppercase tracking-wider",
              event.source === "manual" ? "text-paper/55" : "text-paper/35",
            )}
          >
            {SOURCE_LABEL[event.source]}
          </span>
        </div>
      </div>

      {/* delete (manual memories only) */}
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label="Delete memory"
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-paper/30 opacity-0 transition-opacity hover:bg-paper/[0.06] hover:text-paper group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.li>
  );
}

/* ════════════════════════════════════════════════════════════════
   ADD MEMORY MODAL
   ════════════════════════════════════════════════════════════════ */

function AddMemoryModal({
  open,
  draft,
  setDraft,
  onClose,
  onSave,
}: {
  open: boolean;
  draft: Milestone;
  setDraft: (m: Milestone) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a memory"
      description="Auto-recorded moments aside, mark something only you would know to remember."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Add to timeline</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title">
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="e.g. The day I almost quit — and didn't"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <Input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </Field>
          <Field label="Type">
            <Select
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as MilestoneType })
              }
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="The memory">
          <Textarea
            value={draft.description ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder="What happened, and why it mattered?"
          />
        </Field>
      </div>
    </Modal>
  );
}
