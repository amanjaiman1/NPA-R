"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { MockTest, MockType, MockSection } from "@/lib/types";
import { useChronicle } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { round, sum } from "@/lib/utils";

const TYPES: MockType[] = [
  "Prelims GS",
  "Prelims CSAT",
  "Mains GS",
  "Mains Essay",
  "Mains Optional",
  "Sectional",
];

const QUICK: Record<string, string[]> = {
  "Prelims GS": ["Polity", "Modern History", "Geography", "Economy", "Environment", "Science & Tech", "Current Affairs"],
  "Prelims CSAT": ["Comprehension", "Quantitative", "Reasoning", "Data Interpretation", "Decision Making"],
  Sectional: ["Polity", "History", "Geography", "Economy", "Environment"],
  "Mains GS": ["GS Paper I", "GS Paper II", "GS Paper III", "GS Paper IV"],
  "Mains Essay": ["Essay 1", "Essay 2"],
  "Mains Optional": ["Paper I", "Paper II"],
};

function marksFor(type: MockType) {
  if (type === "Prelims CSAT") return { mark: 2.5, neg: 0.83 };
  return { mark: 2, neg: 0.66 };
}
const isMainsType = (t: MockType) => t.startsWith("Mains");

function normalize(sections: MockSection[], type: MockType): MockSection[] {
  const { mark, neg } = marksFor(type);
  const mains = isMainsType(type);
  return sections
    .filter((s) => s.name.trim())
    .map((s) => {
      if (mains) {
        return {
          ...s,
          attempted: 0,
          correct: 0,
          wrong: 0,
          score: Number(s.score) || 0,
          max: Number(s.max) || 0,
          timeSpent: Number(s.timeSpent) || 0,
        };
      }
      const questions = Number(s.questions) || 0;
      const attempted = Number(s.attempted) || 0;
      const correct = Math.min(Number(s.correct) || 0, attempted);
      const wrong = Math.max(0, attempted - correct);
      return {
        ...s,
        questions,
        attempted,
        correct,
        wrong,
        score: round(correct * mark - wrong * neg, 1),
        max: questions * mark,
        timeSpent: Number(s.timeSpent) || 0,
      };
    });
}

export function MockComposer({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: MockTest;
}) {
  const upsert = useChronicle((s) => s.upsertMock);
  const [draft, setDraft] = useState<MockTest>(initial);

  useEffect(() => {
    if (open) setDraft({ ...initial, sections: initial.sections?.map((s) => ({ ...s })) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mains = isMainsType(draft.type);
  const { neg } = marksFor(draft.type);
  const sections = draft.sections ?? [];
  const norm = normalize(sections, draft.type);
  const hasSections = norm.length > 0;

  const totals = hasSections
    ? {
        score: round(sum(norm.map((s) => s.score)), 1),
        max: sum(norm.map((s) => s.max)),
        attempted: sum(norm.map((s) => s.attempted)),
        correct: sum(norm.map((s) => s.correct)),
        wrong: sum(norm.map((s) => s.wrong)),
        negative: round(sum(norm.map((s) => s.wrong)) * neg, 1),
        time: sum(norm.map((s) => s.timeSpent ?? 0)),
      }
    : null;

  function setSection(i: number, patch: Partial<MockSection>) {
    const next = [...sections];
    next[i] = { ...next[i], ...patch };
    setDraft({ ...draft, sections: next });
  }
  function addSection(name = "") {
    setDraft({
      ...draft,
      sections: [
        ...sections,
        { name, questions: 0, attempted: 0, correct: 0, wrong: 0, score: 0, max: 0, timeSpent: 0 },
      ],
    });
  }

  function save() {
    if (!draft.name.trim()) return;
    const finalSections = hasSections ? norm : undefined;
    const score = totals ? totals.score : draft.score;
    const max = totals ? totals.max : draft.max;
    if (!max) return;
    upsert({
      ...draft,
      sections: finalSections,
      score,
      max,
      attempted: totals?.attempted,
      correct: totals?.correct,
      wrong: totals?.wrong,
      negative: totals && !mains ? totals.negative : undefined,
      unattempted:
        totals && !mains
          ? sum(norm.map((s) => (s.questions ?? 0) - s.attempted))
          : undefined,
      markPerQ: mains ? undefined : marksFor(draft.type).mark,
      negPerWrong: mains ? undefined : neg,
      timeTakenMin: totals ? totals.time : draft.timeTakenMin,
      category: mains ? "Mains" : draft.type.startsWith("Prelims") ? "Prelims" : "Sectional",
    });
    onClose();
  }

  const numInput =
    "w-full rounded-lg border border-paper/12 bg-paper/[0.03] px-2 py-1.5 text-sm text-paper tabular focus:border-paper/30 focus:outline-none";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log a mock test"
      description="Capture section-wise detail — accuracy, time and negatives — to unlock the full analytics."
      className="sm:max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save mock</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Test name">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Prelims GS FLT #14"
            />
          </Field>
          <Field label="Type">
            <Select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as MockType })}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Provider">
            <Input
              value={draft.provider ?? ""}
              onChange={(e) => setDraft({ ...draft, provider: e.target.value })}
              placeholder="e.g. Vision IAS"
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </Field>
        </div>

        {/* Sections */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.7rem] font-medium uppercase tracking-wider text-paper/45">
              Section breakdown
            </span>
            {totals && (
              <span className="tabular text-xs text-paper/55">
                {totals.score}/{totals.max}
                {!mains && ` · −${totals.negative} neg`}
              </span>
            )}
          </div>

          {/* quick add */}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(QUICK[draft.type] ?? []).map((nm) => (
              <button
                key={nm}
                type="button"
                onClick={() => addSection(nm)}
                className="rounded-full border border-paper/12 px-2.5 py-1 text-[0.7rem] text-paper/55 transition-colors hover:border-paper/25 hover:text-paper"
              >
                + {nm}
              </button>
            ))}
          </div>

          {sections.length > 0 && (
            <div className="space-y-1.5">
              {/* header */}
              <div className="flex items-center gap-1.5 px-1 text-[0.6rem] uppercase tracking-wider text-paper/30">
                <span className="flex-1">Section</span>
                {mains ? (
                  <>
                    <span className="w-14 text-center">Score</span>
                    <span className="w-14 text-center">Max</span>
                  </>
                ) : (
                  <>
                    <span className="w-12 text-center">Qs</span>
                    <span className="w-12 text-center">Att</span>
                    <span className="w-12 text-center">Corr</span>
                  </>
                )}
                <span className="w-12 text-center">Min</span>
                <span className="w-6" />
              </div>
              {sections.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    value={s.name}
                    onChange={(e) => setSection(i, { name: e.target.value })}
                    placeholder="Section"
                    className={numInput + " flex-1 text-left"}
                  />
                  {mains ? (
                    <>
                      <input
                        type="number"
                        value={s.score || ""}
                        onChange={(e) => setSection(i, { score: parseFloat(e.target.value) || 0 })}
                        className={numInput + " w-14 text-center"}
                      />
                      <input
                        type="number"
                        value={s.max || ""}
                        onChange={(e) => setSection(i, { max: parseFloat(e.target.value) || 0 })}
                        className={numInput + " w-14 text-center"}
                      />
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        value={s.questions || ""}
                        onChange={(e) => setSection(i, { questions: parseInt(e.target.value) || 0 })}
                        className={numInput + " w-12 text-center"}
                      />
                      <input
                        type="number"
                        value={s.attempted || ""}
                        onChange={(e) => setSection(i, { attempted: parseInt(e.target.value) || 0 })}
                        className={numInput + " w-12 text-center"}
                      />
                      <input
                        type="number"
                        value={s.correct || ""}
                        onChange={(e) => setSection(i, { correct: parseInt(e.target.value) || 0 })}
                        className={numInput + " w-12 text-center"}
                      />
                    </>
                  )}
                  <input
                    type="number"
                    value={s.timeSpent || ""}
                    onChange={(e) => setSection(i, { timeSpent: parseInt(e.target.value) || 0 })}
                    className={numInput + " w-12 text-center"}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, sections: sections.filter((_, k) => k !== i) })
                    }
                    className="grid h-7 w-6 place-items-center rounded text-paper/30 hover:text-paper"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => addSection()}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-paper/60 hover:text-paper"
          >
            <Plus className="h-3.5 w-3.5" /> Add section
          </button>
        </div>

        {/* Manual totals (used when no sections) */}
        {!hasSections && (
          <div className="grid grid-cols-2 gap-4 border-t border-paper/[0.06] pt-4">
            <Field label="Score">
              <Input
                type="number"
                value={draft.score || ""}
                onChange={(e) => setDraft({ ...draft, score: parseFloat(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Max marks">
              <Input
                type="number"
                value={draft.max || ""}
                onChange={(e) => setDraft({ ...draft, max: parseFloat(e.target.value) || 0 })}
              />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
