# Life Dashboard — Module Design

> A lifestyle command centre for the UPSC aspirant. It tracks the inputs —
> sleep, movement, water, meditation, weight, screen time and deep work — and
> then **correlates them with study performance** to reveal which habits
> actually move the needle. Built on the conviction that the body carries the
> mind.

## 1. Tracked metrics & data structure

One unified record per day (`LifeEntry` in `src/lib/types.ts`):

```
LifeEntry (unique per date)
├─ sleepHours, sleepQuality (1–5), bedtime, wakeTime
├─ walkKm, runKm, exerciseMinutes, exerciseType
├─ waterLiters
├─ meditationMin
├─ weightKg
├─ screenTimeMin
└─ deepWorkHours
```

Keeping everything in one daily row (rather than scattered logs) is what makes
cross-metric correlation trivial — every series is just a `date → value` map.
Study hours, mood and revision counts are read from the Daily Journal; mock
scores from the Mock module. Persist **migration v5** backfills `lifeLog` for
returning users.

### Relational mapping (future backend)

```
life_log(id, user_id, date, sleep_hours, sleep_quality, bedtime, wake_time,
         walk_km, run_km, exercise_minutes, exercise_type, water_liters,
         meditation_min, weight_kg, screen_time_min, deep_work_hours)
```

## 2. Daily analytics

The **Today** snapshot shows each metric against its target (sleep 7.5h, deep
work 6h, water 3L, meditation 15m, exercise 30m, walk 5km, screen ≤90m, plus
weight) with a progress bar that fills toward the goal — or, for screen time,
toward a ceiling. One-tap **Log today** opens the composer for the full set.

## 3. Weekly analytics

`weeklyReport` computes a trailing-7-day average for six key metrics, the delta
vs the previous week (coloured by whether "up" is good for that metric), and a
14-day sparkline. Three 21-day trend charts (sleep bars vs target, deep-work
line, screen-time line) show the medium-term shape.

## 4. Correlation engine

Pure functions in `src/lib/life.ts`:

- `pearson(pairs)` — Pearson correlation coefficient (guards n < 3 and zero
  variance).
- `align(mapX, mapY)` — pairs two date-keyed series over their common dates.
- `strengthLabel(r)` — negligible / weak / moderate / strong / very strong.

### Lifestyle factors affecting performance (the headline)

`factorImpact` correlates **every lifestyle metric** against daily study hours
(the performance proxy) and ranks them by |r|, tagging each *helps* or *hurts*.
This directly answers the module's goal — *which lifestyle factors affect UPSC
performance* — e.g. sleep and deep work help; screen time hurts. (Deep work is
excluded from this list since it's essentially study itself.)

### Correlation reports (the requested examples)

`correlationReports` produces the three example reports as scatter plots with a
regression line, the coefficient, sample size, and a plain-English insight:

1. **Study hours vs sleep quality** (same-day).
2. **Mock score vs exercise consistency** (weekly: exercise-days/week vs avg
   mock %).
3. **Mood vs revision completion** (same-day mood vs revision sessions).

### Correlation matrix

`correlationMatrix` renders a 6×6 grayscale `MatrixHeatmap` of pairwise
relationship strength (|r| × 100) among Study, Deep work, Sleep, Exercise, Water
and Screen — a quick scan of what's entangled with what.

### Honest data note

The seed induces realistic relationships (well-rested days → more output;
heavier screen time → fewer study hours; rising exercise consistency alongside
rising mock scores) so the reports are populated immediately — but every
coefficient shown is computed live from the actual data via Pearson's r, not
hard-coded. As real logging replaces the seed, the correlations track reality.

## 5. Dashboard layout

```
┌──────────────────────────────────────────────────────────────────┐
│  LIFE DASHBOARD — "The body carries the mind."        [+ Log today]│
├──────────────────────────────────────────────────────────────────┤
│  TODAY: Sleep · Deep work · Water · Meditation ·                   │
│         Exercise · Walk · Screen · Weight   (vs targets)           │
├──────────────────────────────────────────────────────────────────┤
│  THIS WEEK vs LAST: 6 metric tiles (avg, Δ, sparkline)             │
│  Sleep (21d bars) · Deep work (21d line) · Screen (21d line)       │
├──────────────────────────────────────────────────────────────────┤
│  LIFESTYLE FACTORS AFFECTING STUDY  (ranked diverging bars ±r)     │
├──────────────────────────────────────────────────────────────────┤
│  CORRELATION REPORTS (scatter + r + insight) ×3                    │
│  Study↔Sleep quality · Mocks↔Exercise · Mood↔Revision             │
├──────────────────────────────────────────────────────────────────┤
│  CORRELATION MATRIX (6×6 strength heatmap)                         │
└──────────────────────────────────────────────────────────────────┘
```
