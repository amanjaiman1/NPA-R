"use client";

import { useMemo } from "react";
import {
  Trophy,
  Lock,
  Check,
  Clock,
  X,
  CircleDot,
} from "lucide-react";
import { useChronicle, useHasHydrated } from "@/lib/store";
import type { SelectionStage, StageStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Loading } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";

const STATUS_META: Record<
  StageStatus,
  { icon: typeof Lock; tone: string; ring: string }
> = {
  Locked: { icon: Lock, tone: "text-paper/35", ring: "border-dashed border-paper/20 bg-ink" },
  "In Progress": { icon: CircleDot, tone: "text-paper", ring: "border-paper/30 bg-paper/10" },
  Cleared: { icon: Check, tone: "text-ink", ring: "border-paper/20 bg-paper" },
  "Awaiting Result": { icon: Clock, tone: "text-paper", ring: "border-paper/30 bg-paper/10 animate-pulse-ring" },
  "Not Cleared": { icon: X, tone: "text-paper/50", ring: "border-paper/15 bg-paper/[0.04]" },
};

export default function ArchivePage() {
  const hydrated = useHasHydrated();
  const selection = useChronicle((s) => s.selection);
  const profile = useChronicle((s) => s.profile);

  const byAttempt = useMemo(() => {
    const map = new Map<string, SelectionStage[]>();
    selection.forEach((s) => {
      if (!map.has(s.attempt)) map.set(s.attempt, []);
      map.get(s.attempt)!.push(s);
    });
    return [...map.entries()];
  }, [selection]);

  const cleared = selection.filter((s) => s.status === "Cleared").length;

  if (!hydrated) return <Loading />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Selection Journey Archive"
        title="The road to the list."
        description="This is the spine of the whole Chronicle — the official journey through Prelims, Mains and the Interview, attempt by attempt, until the name appears."
      />

      {/* Narrative hero */}
      <Card className="relative overflow-hidden p-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-paper/[0.05] blur-3xl" />
        <div className="relative">
          <Trophy className="h-7 w-7 text-paper/70" />
          <p className="mt-4 max-w-2xl font-display text-xl font-light italic leading-relaxed text-paper/80">
            “Every setback was tuition. Every cleared stage, a door. {profile.name.split(" ")[0]} is
            writing a story that ends in three letters after a name.”
          </p>
          {profile.mission && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-paper/12 bg-paper/[0.03] px-3.5 py-1.5 text-sm text-paper/70">
              <Trophy className="h-3.5 w-3.5 text-paper/50" />
              <span className="text-paper/45">Mission</span> {profile.mission}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-6">
            <div>
              <p className="tabular text-2xl font-semibold text-paper">
                {profile.attemptNumber}
              </p>
              <p className="text-xs text-paper/45">attempts in</p>
            </div>
            <div>
              <p className="tabular text-2xl font-semibold text-paper">{cleared}</p>
              <p className="text-xs text-paper/45">stages cleared</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-paper">{profile.optionalSubject}</p>
              <p className="text-xs text-paper/45">optional</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Attempts */}
      <div className="space-y-8">
        {byAttempt.map(([attempt, stages]) => (
          <div key={attempt}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-base font-semibold tracking-snugg text-paper">
                {attempt}
              </h2>
              <div className="h-px flex-1 bg-paper/[0.08]" />
            </div>

            <div className="relative space-y-3 pl-2">
              <div className="absolute bottom-3 left-[1.07rem] top-3 w-px bg-paper/10" />
              {stages.map((s) => {
                const meta = STATUS_META[s.status];
                const Icon = meta.icon;
                return (
                  <div key={s.id} className="relative flex gap-5">
                    <span
                      className={cn(
                        "relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border",
                        meta.ring,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", meta.tone)} />
                    </span>
                    <Card
                      className={cn(
                        "flex-1 p-5",
                        s.status === "Locked" && "opacity-60",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-paper">
                            {s.name}
                          </h3>
                          <Badge
                            tone={s.status === "Cleared" ? "solid" : "outline"}
                          >
                            {s.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-paper/40">
                          {s.score && s.score !== "—" && (
                            <span className="tabular font-medium text-paper/70">
                              {s.score}
                            </span>
                          )}
                          {s.date && <span>{formatDate(s.date)}</span>}
                        </div>
                      </div>
                      {s.notes && (
                        <p className="mt-2 text-sm leading-relaxed text-paper/55">
                          {s.notes}
                        </p>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Card className="border-dashed p-6 text-center">
        <p className="text-sm text-paper/50">
          The final entry in this archive is still being written.
        </p>
        <p className="mt-1 font-display text-lg italic text-paper/80">
          Keep going. The list is waiting.
        </p>
      </Card>
    </div>
  );
}
