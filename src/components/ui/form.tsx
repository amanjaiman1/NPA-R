"use client";

import * as React from "react";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[0.7rem] font-medium uppercase tracking-wider text-paper/45",
        className,
      )}
      {...props}
    />
  );
}

const fieldBase =
  "w-full rounded-xl border border-paper/12 bg-paper/[0.03] px-3.5 py-2.5 text-sm text-paper placeholder:text-paper/30 transition-colors focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-[88px] resize-y leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(fieldBase, "appearance-none bg-ink/40 pr-9", className)}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 0.75rem center",
    }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Field({
  label,
  children,
  className,
  hint,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="mt-1 text-[0.7rem] text-paper/35">{hint}</p>}
    </div>
  );
}

/** A 1-5 rating selector rendered as pips. */
export function RatingPicker({
  value,
  onChange,
  max = 5,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  labels?: string[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => {
        const v = i + 1;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            title={labels?.[i]}
            className={cn(
              "h-8 flex-1 rounded-lg border text-xs font-medium transition-all",
              v <= value
                ? "border-accent bg-accent text-accent-fg"
                : "border-paper/12 bg-paper/[0.03] text-paper/40 hover:border-paper/25",
            )}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}


/**
 * Editable list of short strings. `chips` renders inline pills (good for
 * topics/tags); `rows` renders stacked bullet rows (good for wins/lessons).
 */
export function ListEditor({
  items,
  onChange,
  placeholder,
  variant = "rows",
  emptyHint,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  variant?: "chips" | "rows";
  emptyHint?: string;
}) {
  const [val, setVal] = useState("");

  function add() {
    const t = val.trim();
    if (!t) return;
    onChange([...items, t]);
    setVal("");
  }
  function remove(i: number) {
    onChange(items.filter((_, k) => k !== i));
  }

  return (
    <div className="space-y-2">
      {items.length > 0 &&
        (variant === "chips" ? (
          <div className="flex flex-wrap gap-1.5">
            {items.map((it, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-paper/[0.06] py-1 pl-2.5 pr-1 text-xs text-paper/75"
              >
                {it}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="grid h-4 w-4 place-items-center rounded-full text-paper/40 hover:bg-paper/10 hover:text-paper"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {items.map((it, i) => (
              <li
                key={i}
                className="group flex items-start gap-2 rounded-lg bg-paper/[0.03] px-3 py-2 text-sm text-paper/80"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-paper/40" />
                <span className="min-w-0 flex-1">{it}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-paper/30 opacity-0 transition-opacity hover:text-paper group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ))}
      {items.length === 0 && emptyHint && (
        <p className="text-[0.7rem] text-paper/30">{emptyHint}</p>
      )}
      <div className="flex gap-2">
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={add}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-paper/12 bg-paper/[0.03] text-paper/55 transition-colors hover:border-paper/25 hover:text-paper"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
