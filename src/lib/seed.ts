import type {
  ChronicleData,
  Subject,
  JournalEntry,
  MockTest,
  RevisionItem,
  CurrentAffair,
  Mistake,
  Habit,
  SleepLog,
  ExerciseLog,
  Goal,
  Book,
  Milestone,
  Reflection,
  Review,
  TopicLink,
  SelectionStage,
  Topic,
  TopicStatus,
  CACategory,
  MockSection,
  Attachment,
  LifeEntry,
  ExerciseType,
} from "./types";

/* Deterministic RNG so seed data is stable across reloads. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260612);
const rand = () => rng();
const randInt = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;
const r1 = (n: number) => Math.round(n * 10) / 10;
/** Pick n distinct items (deterministic). */
function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let k = 0; k < n && copy.length; k++) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
}

/** A small grayscale SVG "screenshot" used as a sample attachment. */
function shot(label: string): string {
  const lines = Array.from({ length: 7 })
    .map(
      (_, i) =>
        `<rect x='36' y='${96 + i * 28}' width='${380 - (i % 3) * 60}' height='10' rx='5' fill='%2326262b'/>`,
    )
    .join("");
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='320'>` +
    `<rect width='480' height='320' fill='%230c0c0e'/>` +
    `<rect x='16' y='16' width='448' height='40' rx='8' fill='%231b1b1f'/>` +
    `<circle cx='40' cy='36' r='6' fill='%232c2c31'/>` +
    `<rect x='60' y='30' width='220' height='12' rx='6' fill='%232c2c31'/>` +
    `<rect x='16' y='72' width='448' height='232' rx='8' fill='%23141417'/>` +
    lines +
    `<text x='36' y='298' fill='%235a5a62' font-family='monospace' font-size='13'>${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${svg}`;
}

/* Date helpers anchored to "today". */
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (base: Date, n: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};
const agoISO = (n: number) => iso(addDays(TODAY, -n));
const aheadISO = (n: number) => iso(addDays(TODAY, n));

/* ── Subject definitions ─────────────────────────────────────── */

const subjectDefs: {
  id: string;
  name: string;
  paper: Subject["paper"];
  weightage: number;
  base: number; // baseline mastery 0-1
  topics: string[];
}[] = [
  { id: "modern-history", name: "Modern History", paper: "GS1", weightage: 70, base: 0.82, topics: ["Advent of Europeans", "Revolt of 1857", "Socio-Religious Reform", "INC & Moderates", "Gandhian Era", "Revolutionaries", "Partition & Freedom", "Post-Independence"] },
  { id: "art-culture", name: "Art & Culture", paper: "GS1", weightage: 55, base: 0.6, topics: ["Indus Valley", "Temple Architecture", "Classical Dance", "Painting Schools", "Bhakti & Sufi", "Buddhism & Jainism", "UNESCO Sites"] },
  { id: "geography", name: "Geography", paper: "GS1", weightage: 75, base: 0.7, topics: ["Geomorphology", "Climatology", "Oceanography", "Indian Physiography", "Monsoon System", "Resource Distribution", "Mapping"] },
  { id: "society", name: "Indian Society", paper: "GS1", weightage: 45, base: 0.55, topics: ["Salient Features", "Urbanisation", "Globalisation", "Women & Society", "Population", "Communalism"] },
  { id: "polity", name: "Polity & Governance", paper: "GS2", weightage: 92, base: 0.88, topics: ["Constitutional Framework", "Fundamental Rights", "DPSP", "Parliament", "Judiciary", "Federalism", "Local Government", "Constitutional Bodies", "Governance"] },
  { id: "ir", name: "International Relations", paper: "GS2", weightage: 60, base: 0.5, topics: ["India & Neighbours", "Groupings", "Global Institutions", "India-US", "India-China", "Diaspora"] },
  { id: "social-justice", name: "Social Justice", paper: "GS2", weightage: 50, base: 0.52, topics: ["Welfare Schemes", "Health", "Education", "Poverty", "Vulnerable Sections", "SHGs & NGOs"] },
  { id: "economy", name: "Economy", paper: "GS3", weightage: 90, base: 0.66, topics: ["National Income", "Money & Banking", "Fiscal Policy", "Inflation", "External Sector", "Agriculture", "Industry & Infra", "Budget & Survey"] },
  { id: "environment", name: "Environment & Ecology", paper: "GS3", weightage: 82, base: 0.74, topics: ["Ecosystems", "Biodiversity", "Climate Change", "Conservation", "Pollution", "Governance", "Agreements"] },
  { id: "sci-tech", name: "Science & Technology", paper: "GS3", weightage: 55, base: 0.48, topics: ["Space", "Defence Tech", "Biotechnology", "IT & Computers", "Nano & Robotics", "Health Tech"] },
  { id: "security", name: "Internal Security", paper: "GS3", weightage: 40, base: 0.4, topics: ["Security Challenges", "Cyber Security", "Money Laundering", "Border Management", "Left-Wing Extremism", "Security Forces"] },
  { id: "ethics", name: "Ethics (GS4)", paper: "GS4", weightage: 68, base: 0.58, topics: ["Ethics & Human Interface", "Attitude", "Foundational Values", "Emotional Intelligence", "Thinkers", "Public Service Values", "Probity", "Case Studies"] },
  { id: "essay", name: "Essay", paper: "Essay", weightage: 60, base: 0.5, topics: ["Philosophical", "Polity-based", "Economy-based", "Social", "Quote-based", "Structure Practice"] },
  { id: "csat", name: "CSAT", paper: "CSAT", weightage: 50, base: 0.62, topics: ["Comprehension", "Quantitative Aptitude", "Logical Reasoning", "Data Interpretation", "Decision Making"] },
  { id: "sociology", name: "Sociology (Optional)", paper: "Optional", weightage: 88, base: 0.42, topics: ["Sociological Thinkers", "Social Stratification", "Social Movements", "Sociology of Development", "Indian Society & Change", "Caste & Class", "Research Methods"] },
  { id: "current-affairs", name: "Current Affairs", paper: "CurrentAffairs", weightage: 96, base: 0.7, topics: ["Daily News", "Editorials", "PIB & PRS", "Govt Schemes", "Reports & Indices", "Yojana & Kurukshetra"] },
];

function statusFromConfidence(c: number): TopicStatus {
  if (c >= 80) return "mastered";
  if (c >= 55) return "revised";
  if (c >= 25) return "learning";
  return "untouched";
}

function buildSubjects(): Subject[] {
  return subjectDefs.map((s) => {
    const topics: Topic[] = s.topics.map((name, i) => {
      const noise = (rand() - 0.5) * 40;
      const conf = Math.max(
        0,
        Math.min(100, Math.round(s.base * 100 + noise - i * 2)),
      );
      return {
        id: `${s.id}-t${i}`,
        name,
        status: statusFromConfidence(conf),
        confidence: conf,
        revisionCount: conf > 50 ? randInt(1, 5) : randInt(0, 1),
        lastTouched: conf > 20 ? agoISO(randInt(1, 80)) : undefined,
      };
    });
    return {
      id: s.id,
      name: s.name,
      paper: s.paper,
      weightage: s.weightage,
      description: undefined,
      topics,
    };
  });
}

/* ── Journal: one year of entries ────────────────────────────── */

function buildJournal(subjects: Subject[]): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const totalDays = 364;
  const reflections = [
    "Felt the polity concepts finally clicking today. Momentum is everything.",
    "Slow start but answer-writing in the evening salvaged the day.",
    "Distracted by phone in the morning. Tomorrow: airplane mode till noon.",
    "Best deep-work block this week — three hours on Economy without a break.",
    "Tired but showed up. Discipline over motivation.",
    "Revision is where the real exam is won. Did three old GS notes.",
    "Mock score stung a little. Mistakes are data, not verdicts.",
    "Quiet, consistent day. These are the days that compound.",
    "Current affairs felt overwhelming — need a tighter daily system.",
    "Long walk cleared my head. Came back and wrote my best essay yet.",
  ];
  const highlights = [
    "Completed Laxmikanth Ch. 12",
    "Finished monsoon mechanism map",
    "2 full-length essays written",
    "Revised entire Modern History timeline",
    "Solved 60 CSAT questions",
    "PYQ analysis for Economy done",
    "Watched + noted Rajya Sabha TV debate",
    "Made a one-pager on Climate Summits",
  ];
  const winsList = [
    "Hit the 9-hour study target",
    "Finished a tough Polity chapter",
    "Wrote 2 answers under the timer",
    "Cleared yesterday's revision backlog",
    "Stayed off the phone till noon",
    "Solved 50 CSAT questions cleanly",
    "Made crisp current-affairs notes",
    "Woke up on time without snoozing",
  ];
  const failuresList = [
    "Skipped the morning revision slot",
    "Doom-scrolled for almost an hour",
    "Couldn't focus after lunch",
    "Pushed answer-writing to tomorrow again",
    "Slept late, woke up groggy",
    "Avoided the weak subject — again",
  ];
  const lessonsList = [
    "Front-load the hardest subject before fatigue sets in",
    "Phone in another room = instant focus",
    "Revision beats fresh reading this close to the exam",
    "A short walk resets a dead afternoon",
    "Plan tomorrow tonight, not in the morning",
    "Quality of hours beats quantity of hours",
  ];
  const bookTitles = [
    "Indian Polity — Laxmikanth",
    "Indian Economy — Ramesh Singh",
    "Spectrum — Modern History",
    "Environment — Shankar IAS",
    "Certificate Geography — G.C. Leong",
    "India After Gandhi — Guha",
    "An Introduction to Political Theory — Gauba",
  ];
  const caTitles = [
    "RBI monetary policy stance",
    "Supreme Court on electoral bonds",
    "Global Biofuels Alliance summit",
    "New tiger reserve notified",
    "ISRO reusable launch vehicle test",
    "PM-eBus Sewa expansion",
    "Economic Survey highlights",
    "India-EU trade agreement talks",
    "Coastal Regulation Zone norms",
    "Data protection rules notified",
  ];
  const caSources = ["The Hindu", "Indian Express", "PIB", "PRS", "Down To Earth"];
  const mockNames = ["Prelims FLT", "CSAT Practice", "Polity Sectional", "Environment Sectional"];
  const wakeTimes = ["05:10", "05:30", "05:45", "06:00", "06:20", "06:45", "07:10"];
  const sleepTimes = ["22:40", "23:00", "23:20", "23:50", "00:15", "00:40"];
  const shotDays = new Set([1, 4, 9]);

  for (let i = totalDays; i >= 0; i--) {
    const date = addDays(TODAY, -i);
    const dow = date.getDay();
    const progress = (totalDays - i) / totalDays; // 0 -> 1 over time

    // Occasional rest / off days (slightly more later from fatigue mgmt)
    const restProb = 0.1 + (dow === 0 ? 0.12 : 0) + progress * 0.03;
    if (chance(restProb)) continue;

    // Hours ramp from ~4.5 to ~9.5 with weekday/weekend & noise
    const ramp = 4.5 + progress * 4.5;
    const weekendAdj = dow === 0 || dow === 6 ? -0.6 : 0.3;
    let hours = ramp + weekendAdj + (rand() - 0.5) * 2.4;
    hours = Math.max(1.5, Math.min(13, r1(hours)));

    // 2-4 subjects per day
    const n = randInt(2, 4);
    const chosen: Subject[] = [];
    const pool = [...subjects];
    for (let k = 0; k < n && pool.length; k++) {
      const idx = Math.floor(rand() * pool.length);
      chosen.push(pool.splice(idx, 1)[0]);
    }
    let remaining = hours;
    const blocks = chosen.map((s, idx) => {
      const isLast = idx === chosen.length - 1;
      const h = isLast
        ? r1(Math.max(0.5, remaining))
        : r1(Math.max(0.5, remaining * (0.3 + rand() * 0.4)));
      remaining = r1(remaining - h);
      return {
        subjectId: s.id,
        hours: h,
        topics: s.topics.length ? [pick(s.topics).name] : [],
      };
    });
    const totalHours = r1(blocks.reduce((a, b) => a + b.hours, 0));

    const moodBase = 2.5 + (hours / 13) * 2 + (rand() - 0.5);
    const mood = Math.max(1, Math.min(5, Math.round(moodBase)));
    const energy = Math.max(1, Math.min(5, Math.round(moodBase + (rand() - 0.5))));
    const motivation = Math.max(1, Math.min(5, Math.round(moodBase + (rand() - 0.5))));
    const focus = Math.max(1, Math.min(5, Math.round((hours / 13) * 5 + (rand() - 0.5))));

    const topicsCompleted = Array.from(
      new Set(blocks.flatMap((b) => b.topics ?? [])),
    );
    const booksStudied = chance(0.5)
      ? Array.from({ length: randInt(1, 2) }).map(() => {
          const from = randInt(10, 400);
          return { title: pick(bookTitles), fromPage: from, toPage: from + randInt(8, 40) };
        })
      : undefined;
    const revisionSessions = chance(0.5)
      ? Array.from({ length: randInt(1, 2) }).map(() => {
          const s = pick(subjects);
          return {
            subjectId: s.id,
            topic: s.topics.length ? pick(s.topics).name : "Revision",
            minutes: randInt(20, 60),
          };
        })
      : undefined;
    const mocksAttempted = chance(0.12)
      ? [{ name: pick(mockNames), score: randInt(80, 140), max: 200 }]
      : undefined;
    const currentAffairs = chance(0.6)
      ? Array.from({ length: randInt(1, 3) }).map(() => ({
          title: pick(caTitles),
          source: pick(caSources),
        }))
      : undefined;
    const wins = chance(0.6) ? sample(winsList, randInt(1, 2)) : undefined;
    const failures = chance(0.4) ? sample(failuresList, 1) : undefined;
    const lessons = chance(0.45) ? sample(lessonsList, 1) : undefined;

    let attachments: Attachment[] | undefined;
    if (shotDays.has(i)) {
      attachments = [
        {
          id: `att-${iso(date)}-1`,
          kind: "image",
          name: "study-notes.png",
          dataUrl: shot("Polity — notes snapshot"),
          caption: "My handwritten notes from today",
        },
      ];
      if (i === 1)
        attachments.push({
          id: `att-${iso(date)}-2`,
          kind: "image",
          name: "mock-analysis.png",
          dataUrl: shot("Prelims FLT — analysis"),
          caption: "Mock analysis sheet",
        });
    }

    entries.push({
      id: `j-${iso(date)}`,
      date: iso(date),
      wakeTime: pick(wakeTimes),
      sleepTime: pick(sleepTimes),
      blocks,
      totalHours,
      topicsCompleted,
      booksStudied,
      revisionSessions,
      mocksAttempted,
      currentAffairs,
      mood,
      energy,
      motivation,
      focus,
      wins,
      failures,
      lessons,
      highlights: chance(0.4) ? pick(highlights) : undefined,
      reflection: chance(0.5) ? pick(reflections) : undefined,
      tags: chance(0.3)
        ? [pick(["deep-work", "revision", "mocks", "current-affairs", "answer-writing"])]
        : undefined,
      attachments,
    });
  }
  return entries;
}

/* ── Mock tests with an improving trend ──────────────────────── */

/* ── Mock tests: rich section/subject/time/negative data ─────── */

function buildMocks(): MockTest[] {
  const mocks: MockTest[] = [];
  const providers = ["Vision IAS", "Insights", "ForumIAS", "GS Score", "Self-Eval"];
  const clamp01 = (n: number) => Math.max(0.05, Math.min(0.97, n));

  // Prelims GS subject mix (questions ~ 100). Base accuracy varies by subject
  // so strong/weak areas emerge; a recent storyline makes Economy dip and
  // Environment surge so the engine has a clear "why" to detect.
  const gsSubs = [
    { name: "Polity", base: 0.74, q: 18 },
    { name: "Modern History", base: 0.6, q: 15 },
    { name: "Geography", base: 0.66, q: 14 },
    { name: "Economy", base: 0.56, q: 15 },
    { name: "Environment", base: 0.62, q: 14 },
    { name: "Science & Tech", base: 0.5, q: 10 },
    { name: "Current Affairs", base: 0.68, q: 14 },
  ];
  const csatSubs = [
    { name: "Comprehension", base: 0.72, q: 27 },
    { name: "Quantitative", base: 0.55, q: 18 },
    { name: "Reasoning", base: 0.63, q: 17 },
    { name: "Data Interpretation", base: 0.58, q: 10 },
    { name: "Decision Making", base: 0.82, q: 8 },
  ];
  const mainsPapers: { key: string; subs: string[] }[] = [
    { key: "GS Paper I", subs: ["History", "Art & Culture", "Geography", "Society"] },
    { key: "GS Paper II", subs: ["Polity", "Governance", "IR", "Social Justice"] },
    { key: "GS Paper III", subs: ["Economy", "Environment", "Sci & Tech", "Internal Security", "Disaster Mgmt"] },
    { key: "GS Paper IV", subs: ["Ethics Theory", "Case Studies"] },
  ];

  let gsN = 0;
  let csatN = 0;
  let mainsN = 0;
  let secN = 0;

  for (let w = 30; w >= 0; w--) {
    const date = agoISO(w * 7 + randInt(0, 3));
    const t = (30 - w) / 30; // improvement over time
    const recent = w <= 3;
    const roll = rand();

    if (roll < 0.5) {
      // ── Prelims GS ──
      gsN++;
      const mark = 2;
      const neg = 0.66;
      const sections: MockSection[] = gsSubs.map((s) => {
        let acc = s.base + t * 0.12 + (rand() - 0.5) * 0.12;
        if (recent && s.name === "Economy") acc -= 0.15;
        if (recent && s.name === "Environment") acc += 0.13;
        acc = clamp01(acc);
        const attempted = Math.min(
          s.q,
          Math.round(s.q * clamp01(0.78 + t * 0.16 + (rand() - 0.5) * 0.12)),
        );
        const correct = Math.round(attempted * acc);
        const wrong = attempted - correct;
        const score = r1(correct * mark - wrong * neg);
        const timeSpent = Math.round(
          (s.q / 100) * 120 * (0.9 + (1 - acc) * 0.45),
        );
        return { name: s.name, questions: s.q, attempted, correct, wrong, score, max: s.q * mark, timeSpent };
      });
      const sum2 = <K extends keyof MockSection>(k: K) =>
        sections.reduce((a, x) => a + (Number(x[k]) || 0), 0);
      const correct = sum2("correct");
      const wrong = sum2("wrong");
      const attempted = sum2("attempted");
      const score = r1(sum2("score"));
      const timeTaken = sum2("timeSpent");
      const weak = [...sections]
        .sort((a, b) => a.correct / Math.max(1, a.attempted) - b.correct / Math.max(1, b.attempted))
        .slice(0, 2)
        .map((s) => s.name);
      mocks.push({
        id: `m-${date}-${w}`,
        date,
        name: `Prelims GS FLT #${gsN}`,
        type: "Prelims GS",
        category: "Prelims",
        provider: pick(providers),
        score,
        max: 200,
        attempted,
        correct,
        wrong,
        unattempted: 100 - attempted,
        negative: r1(wrong * neg),
        markPerQ: mark,
        negPerWrong: neg,
        durationMin: 120,
        timeTakenMin: timeTaken,
        sections,
        weakAreas: weak,
      });
    } else if (roll < 0.68) {
      // ── Prelims CSAT ──
      csatN++;
      const mark = 2.5;
      const neg = 0.83;
      const sections: MockSection[] = csatSubs.map((s) => {
        const acc = clamp01(s.base + t * 0.1 + (rand() - 0.5) * 0.12);
        const attempted = Math.min(
          s.q,
          Math.round(s.q * clamp01(0.8 + t * 0.12 + (rand() - 0.5) * 0.1)),
        );
        const correct = Math.round(attempted * acc);
        const wrong = attempted - correct;
        return {
          name: s.name,
          questions: s.q,
          attempted,
          correct,
          wrong,
          score: r1(correct * mark - wrong * neg),
          max: s.q * mark,
          timeSpent: Math.round((s.q / 80) * 120 * (0.9 + (1 - acc) * 0.4)),
        };
      });
      const correct = sections.reduce((a, x) => a + x.correct, 0);
      const wrong = sections.reduce((a, x) => a + x.wrong, 0);
      const attempted = sections.reduce((a, x) => a + x.attempted, 0);
      const score = r1(sections.reduce((a, x) => a + x.score, 0));
      mocks.push({
        id: `m-${date}-${w}`,
        date,
        name: `CSAT Practice #${csatN}`,
        type: "Prelims CSAT",
        category: "Prelims",
        provider: pick(providers),
        score,
        max: 200,
        attempted,
        correct,
        wrong,
        unattempted: 80 - attempted,
        negative: r1(wrong * neg),
        markPerQ: mark,
        negPerWrong: neg,
        durationMin: 120,
        timeTakenMin: sections.reduce((a, x) => a + (x.timeSpent ?? 0), 0),
        sections,
      });
    } else if (roll < 0.85) {
      // ── Mains GS ──
      mainsN++;
      const paper = mainsPapers[mainsN % mainsPapers.length];
      const perMax = Math.round(250 / paper.subs.length);
      const sections: MockSection[] = paper.subs.map((name) => {
        const quality = clamp01(0.42 + t * 0.13 + (rand() - 0.5) * 0.1 + (recent ? 0.03 : 0));
        return {
          name,
          attempted: 0,
          correct: 0,
          wrong: 0,
          score: Math.round(perMax * quality),
          max: perMax,
          timeSpent: Math.round((180 / paper.subs.length) * (0.85 + rand() * 0.4)),
        };
      });
      const score = sections.reduce((a, x) => a + x.score, 0);
      const max = sections.reduce((a, x) => a + x.max, 0);
      mocks.push({
        id: `m-${date}-${w}`,
        date,
        name: `Mains ${paper.key} Test`,
        type: "Mains GS",
        category: "Mains",
        provider: pick(providers),
        score,
        max,
        durationMin: 180,
        timeTakenMin: sections.reduce((a, x) => a + (x.timeSpent ?? 0), 0),
        sections,
        notes: "Evaluated — structure improving; conclusions need work.",
      });
    } else {
      // ── Sectional (single subject) ──
      secN++;
      const s = pick(gsSubs);
      const mark = 2;
      const neg = 0.66;
      const q = 25;
      const acc = clamp01(s.base + t * 0.12 + (rand() - 0.5) * 0.14);
      const attempted = Math.round(q * clamp01(0.82 + t * 0.12));
      const correct = Math.round(attempted * acc);
      const wrong = attempted - correct;
      const score = r1(correct * mark - wrong * neg);
      mocks.push({
        id: `m-${date}-${w}`,
        date,
        name: `${s.name} Sectional #${secN}`,
        type: "Sectional",
        category: "Sectional",
        provider: pick(providers),
        score,
        max: q * mark,
        attempted,
        correct,
        wrong,
        unattempted: q - attempted,
        negative: r1(wrong * neg),
        markPerQ: mark,
        negPerWrong: neg,
        durationMin: 30,
        timeTakenMin: randInt(22, 32),
        sections: [
          { name: s.name, questions: q, attempted, correct, wrong, score, max: q * mark, timeSpent: randInt(22, 32) },
        ],
        weakAreas: acc < 0.6 ? [s.name] : undefined,
      });
    }
  }
  return mocks;
}

function buildRevisions(): RevisionItem[] {
  const items: { subjectId: string; topic: string }[] = [
    { subjectId: "polity", topic: "Amendment Process & Basic Structure" },
    { subjectId: "modern-history", topic: "Gandhian Mass Movements" },
    { subjectId: "economy", topic: "Monetary Policy Tools" },
    { subjectId: "environment", topic: "International Climate Agreements" },
    { subjectId: "geography", topic: "Indian Monsoon Mechanism" },
    { subjectId: "ethics", topic: "Foundational Values & Thinkers" },
    { subjectId: "ir", topic: "India's Neighbourhood First Policy" },
    { subjectId: "art-culture", topic: "Temple Architecture Styles" },
    { subjectId: "sci-tech", topic: "Recent Space Missions" },
    { subjectId: "sociology", topic: "Sociological Thinkers (Weber, Durkheim)" },
    { subjectId: "economy", topic: "External Sector & BoP" },
    { subjectId: "polity", topic: "Constitutional Bodies" },
  ];
  const intervals = [1, 3, 7, 14, 30];
  return items.map((it, i) => {
    const reps = randInt(0, 4);
    const intervalDays = intervals[Math.min(reps, intervals.length - 1)];
    const lastN = randInt(0, intervalDays + 4);
    const due = lastN >= intervalDays;
    return {
      id: `rev-${i}`,
      subjectId: it.subjectId,
      topic: it.topic,
      addedOn: agoISO(randInt(40, 120)),
      lastRevised: agoISO(lastN),
      nextDue: due ? agoISO(randInt(0, 3)) : aheadISO(intervalDays - lastN),
      intervalDays,
      repetitions: reps,
      confidence: randInt(2, 5),
    };
  });
}

function buildCurrentAffairs(): CurrentAffair[] {
  const items: { title: string; cat: CACategory; tags: string[]; subj?: string; summary: string }[] = [
    { title: "RBI holds repo rate, shifts stance to neutral", cat: "Economy", tags: ["RBI", "Monetary Policy", "Inflation"], subj: "economy", summary: "MPC keeps repo unchanged citing balanced inflation-growth dynamics; stance moved to neutral signalling room for future cuts." },
    { title: "Supreme Court verdict on electoral bonds", cat: "Polity", tags: ["Judiciary", "Elections", "Transparency"], subj: "polity", summary: "Court strikes down the scheme citing voters' right to information under Article 19(1)(a)." },
    { title: "India hosts Global Biofuels Alliance summit", cat: "International", tags: ["Energy", "Diplomacy", "G20"], subj: "ir", summary: "Alliance aims to accelerate sustainable biofuels deployment and standardisation across member nations." },
    { title: "New tiger reserve notified in Western Ghats", cat: "Environment", tags: ["Conservation", "Biodiversity", "Tiger"], subj: "environment", summary: "Adds to Project Tiger network; strengthens a critical wildlife corridor." },
    { title: "ISRO tests reusable launch vehicle landing", cat: "Science & Tech", tags: ["ISRO", "Space"], subj: "sci-tech", summary: "Autonomous landing experiment validates approach and landing for future reusable launchers." },
    { title: "Cabinet approves expansion of PM-eBus Sewa", cat: "Schemes", tags: ["Urban", "Transport", "EV"], subj: "social-justice", summary: "Scheme to deploy electric buses across cities under a public-private model." },
    { title: "Economic Survey flags need for skilling", cat: "Reports & Indices", tags: ["Survey", "Employment"], subj: "economy", summary: "Highlights demographic dividend window and the imperative to scale vocational skilling." },
    { title: "India-EU push for trade agreement", cat: "International", tags: ["Trade", "EU", "FTA"], subj: "ir", summary: "Negotiations target market access, data and sustainability chapters." },
    { title: "New Coastal Regulation Zone norms", cat: "Environment", tags: ["Coastal", "Regulation"], subj: "environment", summary: "Revised CRZ rules balance livelihoods of fishing communities with ecological safeguards." },
    { title: "Parliamentary panel on data privacy", cat: "Polity", tags: ["Data", "Privacy", "Governance"], subj: "polity", summary: "Committee reviews implementation of the personal data protection framework." },
  ];
  const sources = ["The Hindu", "Indian Express", "PIB", "PRS", "Down To Earth"];
  return items.map((it, i) => ({
    id: `ca-${i}`,
    date: agoISO(randInt(0, 45)),
    title: it.title,
    source: pick(sources),
    category: it.cat,
    tags: it.tags,
    summary: it.summary,
    prelimsRelevant: chance(0.8),
    mainsRelevant: chance(0.7),
    linkedSubjectId: it.subj,
    bookmarked: chance(0.35),
  }));
}

function buildMistakes(): Mistake[] {
  const tpl: {
    subj: string;
    topic: string;
    category: Mistake["category"];
    q: string;
    you: string;
    ans: string;
    exp: string;
    source: string;
  }[] = [
    // ── recurring cluster: Polity / Anti-Defection ──
    { subj: "polity", topic: "Anti-Defection Law", category: "Conceptual", q: "Who decides on disqualification under the Tenth Schedule?", you: "The Governor", ans: "The Speaker / Chairman of the House", exp: "The presiding officer decides; the decision is subject to judicial review (Kihoto Hollohan)." , source: "Prelims FLT #12" },
    { subj: "polity", topic: "Anti-Defection Law", category: "Revision Failure", q: "Does the Tenth Schedule apply to a member voluntarily giving up party membership?", you: "Only on cross-voting", ans: "Yes — voluntarily giving up membership is itself a ground", exp: "Disqualification arises on voluntarily giving up membership OR defying a whip. Revise the grounds.", source: "Daily Quiz" },
    // ── recurring cluster: Economy / Inflation ──
    { subj: "economy", topic: "Inflation Indices", category: "Conceptual", q: "Which index does the RBI primarily target for monetary policy?", you: "WPI", ans: "CPI (Combined)", exp: "RBI's flexible inflation targeting is anchored to CPI, not WPI. WPI base year is 2011-12.", source: "Prelims FLT #14" },
    { subj: "economy", topic: "Inflation Indices", category: "Careless", q: "Core inflation excludes which components?", you: "Marked 'fuel only'", ans: "Food and fuel", exp: "Core inflation strips out both food and fuel. Read all options before marking.", source: "Sectional" },
    // ── recurring cluster: Environment / Protected Areas ──
    { subj: "environment", topic: "Protected Areas", category: "Factual", q: "How many biosphere reserves in India are part of the UNESCO MAB network?", you: "18", ans: "12", exp: "India has 18 biosphere reserves; 12 are in the UNESCO World Network. Track the latest count.", source: "Prelims FLT #11" },
    { subj: "environment", topic: "Protected Areas", category: "Revision Failure", q: "Which protected-area category allows limited human activity?", you: "National Park", ans: "Wildlife Sanctuary / Conservation Reserve", exp: "National Parks are most restrictive; sanctuaries allow regulated activity. Revise IUCN categories.", source: "Revision" },
    // ── recurring cluster: Modern History / Congress Sessions ──
    { subj: "modern-history", topic: "Congress Sessions", category: "Factual", q: "Who presided over the 1929 Lahore session?", you: "Motilal Nehru", ans: "Jawaharlal Nehru", exp: "Lahore 1929 (Purna Swaraj) — Jawaharlal Nehru. Build a one-page president↔session table.", source: "Daily Quiz" },
    { subj: "modern-history", topic: "Congress Sessions", category: "Guessing", q: "Which session first demanded Poorna Swaraj formally?", you: "Guessed Calcutta 1928", ans: "Lahore 1929", exp: "Stop guessing chronology — anchor each session to its year and key resolution.", source: "Prelims FLT #13" },
    // ── singletons across categories/subjects ──
    { subj: "geography", topic: "Ocean Currents", category: "Careless", q: "The Benguela current is warm or cold?", you: "Warm", ans: "Cold", exp: "Misread the qualifier. Underline warm/cold while reading the stem.", source: "Sectional" },
    { subj: "csat", topic: "Time-Speed-Distance", category: "Time Pressure", q: "Two trains problem (relative speed).", you: "Left blank", ans: "Option C", exp: "Spent 4 minutes and abandoned. Apply the 90-second rule: set up the equation or skip.", source: "CSAT Practice #4" },
    { subj: "polity", topic: "Emergency Provisions", category: "Conceptual", q: "Article 352 can be invoked on which grounds?", you: "Failure of constitutional machinery", ans: "War, external aggression or armed rebellion", exp: "352 = national emergency; 356 = failure of constitutional machinery in a state. Don't conflate.", source: "Prelims FLT #10" },
    { subj: "sci-tech", topic: "Space Missions", category: "Guessing", q: "Aditya-L1 is placed at which Lagrange point?", you: "Guessed L2", ans: "L1", exp: "Aditya-L1 → Sun-Earth L1 (the name says it). Avoid 50-50 guesses on factual space items.", source: "Daily Quiz" },
    { subj: "ir", topic: "Groupings", category: "Factual", q: "Which country is NOT a member of the Quad?", you: "Marked Japan", ans: "Japan IS a member", exp: "Quad = India, US, Japan, Australia. Misremembered membership — revise groupings table.", source: "Prelims FLT #9" },
    { subj: "current-affairs", topic: "Government Schemes", category: "Revision Failure", q: "Which ministry runs the PM-eBus Sewa scheme?", you: "Couldn't recall", ans: "Ministry of Housing & Urban Affairs", exp: "Map every scheme to its ministry in your monthly CA compilation.", source: "Monthly CA Test" },
    { subj: "economy", topic: "Banking", category: "Time Pressure", q: "Data-heavy MCQ on SLR/CRR computation.", you: "Over-invested time", ans: "Option B", exp: "Spent 3+ minutes on one data question. Flag and return at the end.", source: "Sectional" },
    { subj: "environment", topic: "Climate Agreements", category: "Factual", q: "The Kigali Amendment relates to which substances?", you: "CO2", ans: "HFCs (hydrofluorocarbons)", exp: "Kigali Amendment to the Montreal Protocol phases down HFCs, not CO2.", source: "Prelims FLT #12" },
    { subj: "society", topic: "Census & Demography", category: "Conceptual", q: "Demographic dividend depends primarily on?", you: "Total population size", ans: "Share of working-age population", exp: "It's about age structure (working-age share), not absolute size.", source: "Daily Quiz" },
    { subj: "ethics", topic: "Thinkers", category: "Revision Failure", q: "Whose idea is the 'veil of ignorance'?", you: "Couldn't recall", ans: "John Rawls", exp: "Rawls — Theory of Justice. Keep a thinker↔concept flashcard deck.", source: "Mains Test" },
    { subj: "sociology", topic: "Sociological Thinkers", category: "Conceptual", q: "Whose concept is 'verstehen' (interpretive understanding)?", you: "Durkheim", ans: "Max Weber", exp: "Verstehen → Weber. Durkheim → social facts. Core optional distinction.", source: "Optional Test" },
  ];

  const intervals = [1, 3, 7, 16, 35];
  return tpl.map((d, i) => {
    const reviewCount = randInt(0, 3);
    const status: Mistake["status"] =
      reviewCount >= 3 ? "Mastered" : reviewCount > 0 ? "Reviewing" : "Open";
    const interval = intervals[Math.min(reviewCount, intervals.length - 1)];
    const due = chance(0.4);
    return {
      id: `mis-${i}`,
      date: agoISO(randInt(3, 90)),
      subjectId: d.subj,
      topic: d.topic,
      category: d.category,
      question: d.q,
      userAnswer: d.you,
      correctAnswer: d.ans,
      explanation: d.exp,
      source: d.source,
      status,
      reviewCount,
      lastReviewed: reviewCount > 0 ? agoISO(randInt(1, interval + 4)) : undefined,
      nextReview:
        status === "Mastered"
          ? aheadISO(randInt(20, 60))
          : due
            ? agoISO(randInt(0, 4))
            : aheadISO(randInt(1, Math.max(2, interval))),
      intervalDays: interval,
    };
  });
}

function buildHabits(): Habit[] {
  const defs = [
    { id: "wake", name: "Wake up by 5:30 AM", cadence: "daily" as const, icon: "sunrise" },
    { id: "news", name: "Read the newspaper", cadence: "daily" as const, icon: "newspaper" },
    { id: "answer", name: "Answer writing", cadence: "daily" as const, icon: "pen" },
    { id: "revise", name: "Revise old notes", cadence: "daily" as const, icon: "repeat" },
    { id: "nosocial", name: "No social media", cadence: "daily" as const, icon: "shield" },
    { id: "meditate", name: "Meditate 10 min", cadence: "daily" as const, icon: "lotus" },
  ];
  return defs.map((d) => {
    const log: Record<string, boolean> = {};
    for (let i = 0; i < 75; i++) {
      const key = agoISO(i);
      // higher adherence for core habits
      const p = d.id === "nosocial" ? 0.62 : d.id === "wake" ? 0.7 : 0.78;
      log[key] = chance(p);
    }
    return {
      id: d.id,
      name: d.name,
      cadence: d.cadence,
      icon: d.icon,
      createdOn: agoISO(90),
      targetPerWeek: 7,
      log,
    };
  });
}

function buildSleep(): SleepLog[] {
  const logs: SleepLog[] = [];
  for (let i = 0; i < 60; i++) {
    const hours = r1(Math.max(4.5, Math.min(9, 6.6 + (rand() - 0.5) * 2.2)));
    logs.push({
      id: `sl-${i}`,
      date: agoISO(i),
      hours,
      quality: Math.max(1, Math.min(5, Math.round((hours / 9) * 5 + (rand() - 0.5)))),
      bedtime: pick(["23:10", "23:40", "00:05", "22:50", "00:30"]),
      wakeup: pick(["05:30", "05:50", "06:15", "05:20", "06:40"]),
    });
  }
  return logs;
}

function buildExercise(): ExerciseLog[] {
  const logs: ExerciseLog[] = [];
  const types: ExerciseLog["type"][] = ["Run", "Walk", "Yoga", "Gym", "Cycling"];
  for (let i = 0; i < 60; i++) {
    if (!chance(0.45)) continue;
    logs.push({
      id: `ex-${i}`,
      date: agoISO(i),
      type: pick(types),
      minutes: randInt(20, 65),
      intensity: randInt(2, 5),
    });
  }
  return logs;
}

function buildLifeLog(journal: JournalEntry[]): LifeEntry[] {
  const jmap = new Map(journal.map((j) => [j.date, j]));
  const out: LifeEntry[] = [];
  const days = 90;
  const exTypes: ExerciseType[] = ["Walk", "Yoga", "Gym", "Cycling"];
  const beds = ["22:50", "23:10", "23:35", "00:05", "00:30"];
  const wakes = ["05:20", "05:35", "05:55", "06:15", "06:40"];
  let weight = 74.5; // trends down with consistency over the window

  for (let i = days; i >= 0; i--) {
    const date = agoISO(i);
    const j = jmap.get(date);
    const studyHours = j?.totalHours ?? 0;
    const mood = j?.mood ?? 3;
    const focus = j?.focus ?? 3;
    const progress = (days - i) / days; // 0 -> 1 (fitness habits improve)

    // Sleep correlates with mood/energy (well-rested → better day) + noise.
    const sleepHours = r1(
      Math.max(4.8, Math.min(8.9, 6.5 + (mood - 3) * 0.45 + (rand() - 0.5) * 1.1)),
    );
    const sleepQuality = Math.max(
      1,
      Math.min(5, Math.round((sleepHours / 8) * 5 + (rand() - 0.5))),
    );

    // Deep work tracks study hours & focus closely.
    const deepWorkHours = r1(
      Math.max(
        0,
        Math.min(studyHours, studyHours * (0.45 + focus * 0.06) + (rand() - 0.5) * 0.8),
      ),
    );

    // Movement: consistency rises over time.
    const didExercise = chance(0.38 + progress * 0.38);
    const exerciseMinutes = didExercise ? randInt(20, 70) : 0;
    const runKm = didExercise && chance(0.45) ? r1(2 + progress * 4 + rand() * 2) : 0;
    const walkKm = r1(1 + progress * 2 + rand() * 2.5);
    const exerciseType: ExerciseType | undefined = didExercise
      ? runKm > 0
        ? "Run"
        : pick(exTypes)
      : undefined;

    // Hydration & meditation: improving habits.
    const waterLiters = r1(Math.max(1, Math.min(4, 2 + progress * 0.8 + (rand() - 0.5))));
    const meditationMin = chance(0.45 + progress * 0.25) ? randInt(5, 20) : 0;

    // Screen time is inversely related to study hours.
    const screenTimeMin = Math.round(
      Math.max(20, Math.min(280, 205 - studyHours * 9 + (rand() - 0.5) * 55)),
    );

    weight = r1(weight - 0.028 - (didExercise ? 0.02 : 0) + (rand() - 0.5) * 0.16);

    out.push({
      id: `life-${date}`,
      date,
      sleepHours,
      sleepQuality,
      bedtime: pick(beds),
      wakeTime: pick(wakes),
      walkKm,
      runKm,
      exerciseMinutes,
      exerciseType,
      waterLiters,
      meditationMin,
      weightKg: weight,
      screenTimeMin,
      deepWorkHours,
    });
  }
  return out;
}

function buildGoals(): Goal[] {
  return [
    { id: "g1", title: "Finish Polity full syllabus + 3 revisions", horizon: "Quarterly", metricLabel: "Topics revised", target: 9, current: 7, unit: "topics", deadline: aheadISO(70), status: "Active", createdOn: agoISO(60), linkedSubjectId: "polity" },
    { id: "g2", title: "Score 120+ in next Prelims FLT", horizon: "Monthly", metricLabel: "Score", target: 120, current: 112, unit: "marks", deadline: aheadISO(20), status: "Active", createdOn: agoISO(25) },
    { id: "g3", title: "Write 2 essays every week", horizon: "Weekly", metricLabel: "Essays", target: 2, current: 1, unit: "essays", deadline: aheadISO(4), status: "Active", createdOn: agoISO(7), linkedSubjectId: "essay" },
    { id: "g4", title: "Daily 9 hours of focused study", horizon: "Daily", metricLabel: "Hours", target: 9, current: 8, unit: "hrs", status: "Active", createdOn: agoISO(2) },
    { id: "g5", title: "Complete Sociology optional lectures", horizon: "Quarterly", metricLabel: "Lectures", target: 130, current: 15, unit: "lectures", deadline: aheadISO(120), status: "Active", createdOn: agoISO(30), linkedSubjectId: "sociology" },
    { id: "g6", title: "Build a current-affairs revision system", horizon: "Quarterly", metricLabel: "Monthly compilations", target: 3, current: 2, unit: "months", deadline: aheadISO(40), status: "Active", createdOn: agoISO(50) },
    { id: "g7", title: "Reach final selection — CSE 2027", horizon: "Long-term", metricLabel: "Journey", deadline: aheadISO(345), status: "Active", createdOn: agoISO(560) },
    { id: "g8", title: "Maintain a 30-day study streak", horizon: "Monthly", metricLabel: "Days", target: 30, current: 18, unit: "days", deadline: aheadISO(12), status: "Active", createdOn: agoISO(18) },
  ];
}

function buildBooks(): Book[] {
  const defs: Omit<Book, "id" | "currentPage" | "status">[] = [
    { title: "Indian Polity", author: "M. Laxmikanth", subjectId: "polity", paper: "GS2", totalPages: 900, isStandard: true, rating: 5, startedOn: agoISO(400) },
    { title: "Indian Economy", author: "Ramesh Singh", subjectId: "economy", paper: "GS3", totalPages: 760, isStandard: true, rating: 4, startedOn: agoISO(300) },
    { title: "Certificate Physical & Human Geography", author: "G.C. Leong", subjectId: "geography", paper: "GS1", totalPages: 430, isStandard: true, rating: 5, startedOn: agoISO(380) },
    { title: "India's Struggle for Independence", author: "Bipan Chandra", subjectId: "modern-history", paper: "GS1", totalPages: 600, isStandard: true, rating: 5, startedOn: agoISO(420) },
    { title: "Environment", author: "Shankar IAS", subjectId: "environment", paper: "GS3", totalPages: 410, isStandard: true, rating: 4, startedOn: agoISO(250) },
    { title: "Ethics, Integrity & Aptitude", author: "Lexicon", subjectId: "ethics", paper: "GS4", totalPages: 520, isStandard: true, rating: 3, startedOn: agoISO(120) },
    { title: "Introduction to the Constitution", author: "D.D. Basu", subjectId: "polity", paper: "GS2", totalPages: 480, isStandard: true, rating: 4 },
    { title: "Contemporary Essays", author: "Ramesh Singh", subjectId: "essay", paper: "Essay", totalPages: 320, rating: 3, startedOn: agoISO(60) },
    { title: "Sociology: Themes and Perspectives", author: "Haralambos & Holborn", subjectId: "sociology", paper: "Optional", totalPages: 540, isStandard: true, rating: 4, startedOn: agoISO(40) },
    { title: "India After Gandhi", author: "Ramachandra Guha", subjectId: "modern-history", paper: "GS1", totalPages: 890, rating: 5, startedOn: agoISO(150) },
  ];
  return defs.map((b, i) => {
    const ratio = rand();
    const completed = ratio > 0.7;
    const currentPage = completed ? b.totalPages : Math.round(b.totalPages * (0.2 + rand() * 0.6));
    return {
      ...b,
      id: `book-${i}`,
      currentPage,
      status: completed ? "Completed" : currentPage > 0 ? "Reading" : "To Read",
      finishedOn: completed ? agoISO(randInt(5, 90)) : undefined,
    };
  });
}

function buildMilestones(): Milestone[] {
  return [
    { id: "ms1", date: agoISO(560), title: "Began the journey", type: "Start", description: "Quit the comfort of routine, committed to civil services. Day Zero.", pinned: true },
    { id: "ms2", date: agoISO(500), title: "Finished NCERTs (6-12)", type: "Phase", description: "Built the foundation across History, Geography, Polity and Economy." },
    { id: "ms3", date: agoISO(430), title: "Chose Sociology as optional", type: "Achievement", description: "After much deliberation, locked Sociology — understanding society is the heart of policing and public service." },
    { id: "ms4", date: agoISO(360), title: "First full-length mock", type: "Exam", description: "Scored 78/200. Humbling, but a baseline to beat." },
    { id: "ms5", date: agoISO(300), title: "Prelims 2025 — not cleared", type: "Setback", description: "Missed the cutoff by 4 marks. Regrouped after a week off." },
    { id: "ms6", date: agoISO(210), title: "Crossed 100 in mocks", type: "Achievement", description: "Consistency in revision started showing on the scoreboard." },
    { id: "ms7", date: agoISO(120), title: "Completed first answer-writing cycle", type: "Phase", description: "60 days of daily answer writing for Mains." },
    { id: "ms8", date: agoISO(30), title: "Best mock yet — 138/200", type: "Achievement", description: "Everything clicked. Proof the system works." },
    { id: "ms9", date: aheadISO(345), title: "UPSC CSE 2027 Prelims", type: "Exam", description: "The next checkpoint.", pinned: true },
  ];
}

function buildReflections(): Reflection[] {
  const prompts = [
    "What did today teach me about myself?",
    "What am I avoiding, and why?",
    "Where did I feel most alive in my studies today?",
    "What would I tell a friend who had my day?",
    "What is one thing I'm grateful for right now?",
  ];
  const contents = [
    "There's a quiet kind of courage in sitting with a hard chapter until it yields. Today I found some of it.",
    "I keep measuring myself against an imaginary topper. The only fair comparison is who I was last month.",
    "Fear of the result is louder on low-energy days. Naming it helped me return to the desk.",
    "Selection is not a finish line, it's a door. I want to walk through it as someone I respect.",
    "Slow is smooth, smooth is fast. I'm learning to trust the process even when the scoreboard is quiet.",
    "Today I forgave myself for yesterday. That, too, is preparation.",
  ];
  return Array.from({ length: 9 }).map((_, i) => ({
    id: `ref-${i}`,
    date: agoISO(i * 6 + randInt(0, 3)),
    prompt: pick(prompts),
    content: pick(contents),
    mood: randInt(2, 5),
    gratitude: chance(0.5) ? [pick(["Family's support", "A quiet library", "Good health", "A clear morning", "Encouraging mentor"]), pick(["A small win", "Rain outside", "Hot chai", "A kind message"])] : undefined,
  }));
}

function buildReviews(): Review[] {
  return [
    { id: "rv-w1", type: "Weekly", periodLabel: "This week", startDate: agoISO(6), endDate: agoISO(0), totalHours: 54, mocksTaken: 1, rating: 4, wins: ["Crossed 50 study hours", "Finished Economy external sector"], struggles: ["Sleep slipped past midnight twice"], lessons: ["Front-load the hardest subject"], nextFocus: ["Environment revision", "2 essays"] },
    { id: "rv-w2", type: "Weekly", periodLabel: "Last week", startDate: agoISO(13), endDate: agoISO(7), totalHours: 48, mocksTaken: 2, rating: 3, wins: ["Two sectionals attempted"], struggles: ["Current affairs backlog grew"], lessons: ["A daily 30-min CA slot is non-negotiable"], nextFocus: ["Clear CA backlog"] },
    { id: "rv-m1", type: "Monthly", periodLabel: "This month", startDate: agoISO(29), endDate: agoISO(0), totalHours: 212, mocksTaken: 5, rating: 4, wins: ["Best mock score yet (138)", "Reached Sociology lecture 15"], struggles: ["Health dipped mid-month"], lessons: ["Protect the morning block"], nextFocus: ["Start Mains answer writing cycle 2"] },
    { id: "rv-y1", type: "Yearly", periodLabel: "Past 12 months", startDate: agoISO(364), endDate: agoISO(0), totalHours: 2480, mocksTaken: 25, rating: 4, wins: ["Built an unshakeable daily system", "Optional notes complete", "Mock average up 60%"], struggles: ["One failed prelims attempt", "Burnout in month 7"], lessons: ["Rest is part of the plan", "Revision > new material"], nextFocus: ["Peak for CSE 2027", "Mains-first strategy"] },
  ];
}

function buildTopicLinks(): TopicLink[] {
  // Resolve a (subjectId, topicName) pair to its Topic id ("<subj>-t<index>").
  const tid = (subjectId: string, topicName: string) => {
    const def = subjectDefs.find((s) => s.id === subjectId);
    const idx = def ? def.topics.indexOf(topicName) : -1;
    return `${subjectId}-t${idx >= 0 ? idx : 0}`;
  };

  // Curated cross-topic relationships. Authored by readable names so the
  // graph reads like an Obsidian vault of the syllabus.
  // [srcSubject, srcTopic, dstSubject, dstTopic, relation?]
  const defs: [string, string, string, string, string?][] = [
    // ── Polity web ──
    ["polity", "Constitutional Framework", "polity", "Fundamental Rights", "leads to"],
    ["polity", "Constitutional Framework", "polity", "DPSP", "leads to"],
    ["polity", "Fundamental Rights", "polity", "DPSP", "contrast"],
    ["polity", "Constitutional Framework", "polity", "Parliament", "leads to"],
    ["polity", "Parliament", "polity", "Judiciary", "related"],
    ["polity", "Parliament", "polity", "Constitutional Bodies", "related"],
    ["polity", "Judiciary", "polity", "Fundamental Rights", "related"],
    ["polity", "Federalism", "polity", "Local Government", "leads to"],
    ["polity", "Federalism", "polity", "Parliament", "related"],
    ["polity", "Governance", "polity", "Constitutional Bodies", "related"],
    // ── Modern History chain: 1857 → National Movement → Congress ──
    ["modern-history", "Advent of Europeans", "modern-history", "Revolt of 1857", "leads to"],
    ["modern-history", "Revolt of 1857", "modern-history", "Socio-Religious Reform", "related"],
    ["modern-history", "Revolt of 1857", "modern-history", "INC & Moderates", "leads to"],
    ["modern-history", "Socio-Religious Reform", "modern-history", "INC & Moderates", "leads to"],
    ["modern-history", "INC & Moderates", "modern-history", "Gandhian Era", "leads to"],
    ["modern-history", "Gandhian Era", "modern-history", "Revolutionaries", "contrast"],
    ["modern-history", "Gandhian Era", "modern-history", "Partition & Freedom", "leads to"],
    ["modern-history", "Partition & Freedom", "modern-history", "Post-Independence", "leads to"],
    // ── History ↔ Polity ↔ Sociology (optional) ──
    ["modern-history", "Post-Independence", "polity", "Constitutional Framework", "prerequisite"],
    ["polity", "Constitutional Framework", "sociology", "Indian Society & Change", "related"],
    ["sociology", "Indian Society & Change", "society", "Salient Features", "related"],
    ["sociology", "Sociological Thinkers", "ethics", "Thinkers", "related"],
    ["sociology", "Caste & Class", "society", "Communalism", "related"],
    ["sociology", "Social Movements", "modern-history", "INC & Moderates", "related"],
    ["sociology", "Sociology of Development", "social-justice", "Welfare Schemes", "related"],
    // ── International Relations ──
    ["ir", "Groupings", "ir", "Global Institutions", "related"],
    ["ir", "India-China", "ir", "India & Neighbours", "related"],
    ["ir", "Groupings", "economy", "External Sector", "related"],
    // ── Economy ──
    ["economy", "External Sector", "economy", "Money & Banking", "related"],
    ["economy", "Money & Banking", "economy", "Inflation", "leads to"],
    ["economy", "Inflation", "economy", "Fiscal Policy", "related"],
    ["economy", "Fiscal Policy", "economy", "Budget & Survey", "leads to"],
    ["economy", "Agriculture", "geography", "Resource Distribution", "related"],
    ["economy", "Industry & Infra", "geography", "Resource Distribution", "related"],
    // ── Geography ↔ Environment ──
    ["geography", "Monsoon System", "geography", "Climatology", "related"],
    ["geography", "Climatology", "environment", "Climate Change", "leads to"],
    ["geography", "Oceanography", "environment", "Ecosystems", "related"],
    ["environment", "Climate Change", "environment", "Agreements", "leads to"],
    ["environment", "Biodiversity", "environment", "Conservation", "leads to"],
    ["environment", "Conservation", "environment", "Governance", "related"],
    ["environment", "Climate Change", "ir", "Global Institutions", "related"],
    ["environment", "Agreements", "ir", "Groupings", "related"],
    // ── Society & Social Justice ──
    ["society", "Salient Features", "society", "Communalism", "related"],
    ["society", "Urbanisation", "geography", "Resource Distribution", "related"],
    ["society", "Globalisation", "economy", "External Sector", "related"],
    ["society", "Women & Society", "social-justice", "Vulnerable Sections", "related"],
    ["social-justice", "Welfare Schemes", "current-affairs", "Govt Schemes", "related"],
    ["social-justice", "Health", "social-justice", "Education", "related"],
    ["social-justice", "Poverty", "economy", "Inflation", "related"],
    // ── Current Affairs as a hub ──
    ["current-affairs", "Govt Schemes", "economy", "Budget & Survey", "related"],
    ["current-affairs", "Reports & Indices", "economy", "National Income", "related"],
    ["current-affairs", "Editorials", "ir", "Global Institutions", "related"],
    ["current-affairs", "PIB & PRS", "polity", "Governance", "related"],
    // ── Science, Tech & Security ──
    ["sci-tech", "Space", "sci-tech", "Defence Tech", "related"],
    ["sci-tech", "Biotechnology", "sci-tech", "Health Tech", "related"],
    ["sci-tech", "IT & Computers", "security", "Cyber Security", "leads to"],
    ["security", "Cyber Security", "security", "Security Challenges", "related"],
    ["security", "Money Laundering", "economy", "Money & Banking", "related"],
    ["security", "Border Management", "ir", "India & Neighbours", "related"],
    // ── Ethics ──
    ["ethics", "Foundational Values", "ethics", "Public Service Values", "leads to"],
    ["ethics", "Public Service Values", "ethics", "Probity", "leads to"],
    ["ethics", "Case Studies", "ethics", "Probity", "related"],
    ["ethics", "Emotional Intelligence", "ethics", "Attitude", "related"],
    // ── Art & Culture ──
    ["art-culture", "Bhakti & Sufi", "modern-history", "Socio-Religious Reform", "related"],
    ["art-culture", "Buddhism & Jainism", "art-culture", "Temple Architecture", "related"],
    ["art-culture", "Temple Architecture", "art-culture", "UNESCO Sites", "related"],
    // ── Essay & CSAT ──
    ["essay", "Polity-based", "polity", "Governance", "related"],
    ["essay", "Economy-based", "economy", "Budget & Survey", "related"],
    ["essay", "Philosophical", "ethics", "Thinkers", "related"],
    ["csat", "Quantitative Aptitude", "csat", "Data Interpretation", "related"],
    ["csat", "Comprehension", "csat", "Logical Reasoning", "related"],
  ];

  const seen = new Set<string>();
  const links: TopicLink[] = [];
  defs.forEach(([sa, ta, sb, tb, r], i) => {
    const source = tid(sa, ta);
    const target = tid(sb, tb);
    const key = [source, target].sort().join("|");
    if (source === target || seen.has(key)) return;
    seen.add(key);
    links.push({
      id: `lk-${i}`,
      source,
      target,
      relation: r ?? "related",
      createdOn: agoISO(randInt(5, 300)),
    });
  });
  return links;
}

function buildSelection(): SelectionStage[] {
  return [
    { id: "s1", name: "Prelims", attempt: "CSE 2025", status: "Not Cleared", date: agoISO(300), score: "88 / 200", notes: "Missed cutoff by ~4 marks. The fire that started it all." },
    { id: "s2", name: "Prelims", attempt: "CSE 2026", status: "Cleared", date: agoISO(40), score: "121 / 200", notes: "Crossed the line with margin. Onward to Mains." },
    { id: "s3", name: "Mains", attempt: "CSE 2026", status: "Awaiting Result", date: agoISO(8), score: "—", notes: "Wrote all 9 papers. Essay went well; GS-3 was tight." },
    { id: "s4", name: "Interview", attempt: "CSE 2026", status: "Locked", notes: "The final 275 marks. DAF preparation underway." },
    { id: "s5", name: "Final Result", attempt: "CSE 2026", status: "Locked", notes: "The name in the list." },
  ];
}

/* ── Assemble ────────────────────────────────────────────────── */

export function createSeedData(): ChronicleData {
  const subjects = buildSubjects();
  const journal = buildJournal(subjects);
  return {
    profile: {
      name: "Aman Jaiman",
      tagline: "Do or die · CSE 2027.",
      mission: "National Police Academy — IPS",
      targetExam: "UPSC CSE 2027",
      examDate: aheadISO(345),
      attemptNumber: 2,
      optionalSubject: "Sociology",
      startDate: agoISO(560),
      dailyHourTarget: 9,
    },
    subjects,
    journal,
    mocks: buildMocks(),
    revisions: buildRevisions(),
    currentAffairs: buildCurrentAffairs(),
    mistakes: buildMistakes(),
    habits: buildHabits(),
    sleep: buildSleep(),
    exercise: buildExercise(),
    lifeLog: buildLifeLog(journal),
    goals: buildGoals(),
    books: buildBooks(),
    milestones: buildMilestones(),
    reflections: buildReflections(),
    reviews: buildReviews(),
    topicLinks: buildTopicLinks(),
    selection: buildSelection(),
  };
}
