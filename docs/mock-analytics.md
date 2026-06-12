# Mock Test Analytics Center — Module Design

> A performance terminal for UPSC mocks. Not a scorecard — an instrument panel.
> It tracks Prelims & Mains scores, subject-wise accuracy, negative marking,
> time per section, and surfaces **why** marks are improving or declining, with
> AI-style recommendations on what to fix next.

Built for **Aman Jaiman** · Mission: National Police Academy (IPS) · do-or-die
**CSE 2027** · Optional: Sociology.

## 1. Data structures

`MockTest` (in `src/lib/types.ts`) was extended from a flat score to a
section-aware record:

```
MockTest
├─ id, date, name, type (Prelims GS|Prelims CSAT|Mains GS|Mains Essay|
│                         Mains Optional|Sectional), category, provider
├─ score, max                         ← totals (derived from sections if present)
├─ attempted, correct, wrong, unattempted
├─ negative        marks lost to negative marking
├─ markPerQ, negPerWrong   scoring scheme (GS 2 / −0.66, CSAT 2.5 / −0.83)
├─ durationMin, timeTakenMin
└─ sections: MockSection[]
       ├─ name        subject ("Polity") | paper ("GS Paper II") | area ("Quant")
       ├─ questions, attempted, correct, wrong
       ├─ score, max
       └─ timeSpent   minutes  → powers time-allocation analysis
```

Totals are **derived from sections** when present (single source of truth), so
accuracy, negatives and time always reconcile with the breakdown. Mains sections
carry `score/max` (answer quality); prelims sections carry questions/attempts.
Migration-free: every new field is optional, so older/simple mocks still render.

### Relational mapping (future backend)

```
mocks(id, user_id, date, name, type, category, provider, score, max,
      attempted, correct, wrong, unattempted, negative, mark_per_q,
      neg_per_wrong, duration_min, time_taken_min)
mock_sections(id, mock_id, name, questions, attempted, correct, wrong,
              score, max, time_spent)
```

## 2. Analytics engine

Pure functions in `src/lib/mock-analytics.ts`, all over `MockTest[]`:

- `mockPoints` → normalised time series (pct, accuracy, attempted, negative, time).
- `movingAverage(values, window)` → smoothed trend line (MA-5).
- `candles` → per-mock **OHLC**: open = previous score %, close = this score %,
  high/low = best/worst **section** score % that day (intra-test spread), with
  volume = questions attempted.
- `summarize` → latest/delta, average, best/worst, avg accuracy, avg negatives,
  projected score (recent-form average).
- `subjectAccuracy` → aggregates every section across mocks into per-subject
  accuracy, marks, samples and average time.
- `strengthsWeaknesses` → top/bottom subjects by accuracy.
- `subjectDeltas` → per-subject accuracy in the recent window vs the prior
  window → biggest **improver** and **decliner**.
- `explainTrend` → the headline feature (below).
- `recommendations` → prioritised, data-driven actions.

### "Why are marks moving?" (trend attribution)

`explainTrend` compares the **recent N mocks** against the **previous N** and
decomposes the score change into named drivers:

1. **Accuracy** delta (correct-per-attempt, pts).
2. **Attempt rate** delta (questions attempted).
3. **Negative marking** delta (marks lost).
4. **Subject movers** — the subject whose accuracy rose/fell most.

Each driver is tagged positive/negative and ranked by magnitude, producing a
plain-English explanation like *"Scores have dipped — down 6 pts. Driver:
Economy accuracy down 15 pts; negatives +4 marks."*

### AI recommendations

`recommendations` emits up to six prioritised cards from the data: shore up the
weakest subject, tame negative marking (elimination rule), lift/!trim attempt
rate, cap time on inefficient sections (high time + low accuracy), reverse a
recent decline, and keep banking the strongest subject.

## 3. Charts (trading-terminal aesthetic)

Hand-built SVG, grayscale (direction shown via fill/hollow + arrows, not colour):

- **Candlestick terminal** (`components/mocks/candle-chart.tsx`): candles +
  MA-5 overlay + volume sub-panel + **crosshair readout** (O/H/L/C, score,
  accuracy) + right-hand price axis. Up = filled, down = hollow.
- **Accuracy / score-% line** with hover tooltip.
- **Negative-marking bars** (or time-per-mock when no negatives).
- **Subject accuracy bars** (ranked, brightness by band).
- **Time vs accuracy** bars per section (spot the time sinks).

## 4. Dashboard design

```
┌──────────────────────────────────────────────────────────────────┐
│  MOCK ANALYTICS · Aman's performance terminal                      │
│  [Prelims GS][CSAT][Mains][Sectional][All]            [+ Log mock] │
├──────────────────────────────────────────────────────────────────┤
│ LATEST 118/200 ▲+4 │ AVG 58% │ BEST 71% │ ACC 64% │ NEG −16 │ PROJ 122 │  ← ticker strip
├──────────────────────────────────────────────────────────────────┤
│  SCORE // PRELIMS GS              up ▮  down ▯  ─ MA-5             │
│      ┃  ▮ ┃    ▯                                                   │
│   ▯ ┃▮┃ ┃▮┃ ▮ ┃   (candles + moving average)                      │
│   ▁▃▂▅▃▆▄  (volume)                                                │
├───────────────────────────────┬──────────────────────────────────┤
│  Accuracy trend (line)        │  Negative marking (bars)          │
├───────────────────────────────┴──────────────────────────────────┤
│  ⤴ WHY YOUR MARKS ARE MOVING            58% → 64%                  │
│  ▲ Accuracy +6 pts   ▼ Economy −15 pts   ▲ Environment +13 pts    │
├───────────────────────────────┬──────────────────────────────────┤
│  Subject-wise accuracy bars   │  ✦ AI recommendations (HIGH/MED)  │
├───────────────────────────────┴──────────────────────────────────┤
│  Time vs accuracy by section   │   Mock log table                 │
└──────────────────────────────────────────────────────────────────┘
```

The category tabs switch the entire terminal between Prelims GS, CSAT, Mains,
Sectional and All; every panel recomputes from the filtered set.

## 5. Performance insights

The ticker strip gives the at-a-glance read (latest, average, best, accuracy,
negatives/mock, projected score from recent form). The candle terminal shows the
trajectory and intra-test spread; the trend-attribution panel converts that into
*causes*; the subject and time panels localise the problem; and the
recommendations turn it into a to-do list — the loop from *what* → *why* → *do
next*.

## 6. Logging flow

`MockComposer` supports section-wise entry with quick-add chips per type
(Polity/History/… for Prelims; GS Paper I–IV for Mains). For prelims it takes
questions/attempted/correct/time and **auto-computes** net score, max and
negatives from the scoring scheme; for mains it takes score/max/time. Totals roll
up live. A no-sections fallback (manual score/max) keeps quick logging possible.
