/* ════════════════════════════════════════════════════════════════
   THE UPSC CHRONICLE — UNIFIED DOMAIN MODEL
   A single typed graph that connects every feature: a day in the
   journal links to subjects, mocks, mistakes, current affairs, the
   knowledge graph, habits, reflections and milestones.
   ════════════════════════════════════════════════════════════════ */

export type ISODate = string; // "yyyy-mm-dd"
export type Theme = "dark" | "light";

/* ── Syllabus / Subjects ─────────────────────────────────────── */

export type PaperCode =
  | "GS1"
  | "GS2"
  | "GS3"
  | "GS4"
  | "Essay"
  | "CSAT"
  | "Optional"
  | "CurrentAffairs";

export type TopicStatus =
  | "untouched"
  | "learning"
  | "revised"
  | "mastered";

export interface Topic {
  id: string;
  name: string;
  status: TopicStatus;
  confidence: number; // 0-100
  revisionCount: number;
  lastTouched?: ISODate;
}

export interface Subject {
  id: string;
  name: string;
  paper: PaperCode;
  description?: string;
  weightage?: number; // relative exam weight 0-100
  topics: Topic[];
}

/* ── Daily Journal ───────────────────────────────────────────── */

export interface StudyBlock {
  subjectId: string;
  hours: number;
  topics?: string[];
}

/** A book touched on a given day. */
export interface BookRead {
  bookId?: string; // optional link to a Library book
  title: string;
  fromPage?: number;
  toPage?: number;
}

/** A revision session captured within a day. */
export interface RevisionSession {
  subjectId?: string;
  topic: string;
  minutes?: number;
}

/** A mock attempted on a day (lightweight reference or inline note). */
export interface MockRef {
  mockId?: string; // optional link to a logged MockTest
  name: string;
  score?: number;
  max?: number;
}

/** A current-affairs item covered on a day. */
export interface CARef {
  caId?: string; // optional link to a CurrentAffair
  title: string;
  source?: string;
}

export type AttachmentKind = "image" | "file";

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  /** base64 data URL — images are downscaled before storing. */
  dataUrl: string;
  caption?: string;
  size?: number; // bytes (approx)
}

export interface JournalEntry {
  id: string;
  date: ISODate; // unique per day

  /* daily rhythm */
  wakeTime?: string; // "HH:MM"
  sleepTime?: string; // "HH:MM" (when they went to bed)

  /* study */
  blocks: StudyBlock[];
  totalHours: number;
  topicsCompleted?: string[];
  booksStudied?: BookRead[];
  revisionSessions?: RevisionSession[];
  mocksAttempted?: MockRef[];
  currentAffairs?: CARef[];

  /* state of mind (1-5) */
  mood: number;
  energy: number;
  motivation: number;
  focus: number;

  /* narrative */
  wins?: string[];
  failures?: string[];
  lessons?: string[];
  highlights?: string;
  reflection?: string;
  tags?: string[];

  /* memory */
  attachments?: Attachment[];

  /* legacy / planning */
  tasksPlanned?: number;
  tasksDone?: number;
}

/* ── Mock Tests ──────────────────────────────────────────────── */

export type MockType =
  | "Prelims GS"
  | "Prelims CSAT"
  | "Mains GS"
  | "Mains Essay"
  | "Mains Optional"
  | "Sectional";

export type MockCategory = "Prelims" | "Mains" | "Sectional";

/**
 * Per-section / per-subject breakdown of a mock. For prelims this captures
 * questions/attempts/accuracy; for mains it captures score/max as answer
 * quality. `timeSpent` (minutes) powers the time-allocation analysis.
 */
export interface MockSection {
  name: string; // subject ("Polity") or paper ("GS Paper II") or area ("Quant")
  questions?: number; // total questions in the section (prelims)
  attempted: number;
  correct: number;
  wrong: number;
  score: number; // net marks for this section
  max: number; // maximum marks for this section
  timeSpent?: number; // minutes spent
}

export interface MockTest {
  id: string;
  date: ISODate;
  name: string;
  type: MockType;
  category?: MockCategory;
  provider?: string;
  score: number;
  max: number;
  attempted?: number;
  correct?: number;
  wrong?: number;
  unattempted?: number;
  negative?: number; // marks lost to negative marking
  markPerQ?: number; // marks per correct answer
  negPerWrong?: number; // penalty per wrong answer
  durationMin?: number; // allotted time
  timeTakenMin?: number; // time actually used
  sections?: MockSection[];
  notes?: string;
  weakAreas?: string[];
}

/* ── Revision (spaced repetition) ────────────────────────────── */

export interface RevisionItem {
  id: string;
  subjectId: string;
  topic: string;
  addedOn: ISODate;
  lastRevised?: ISODate;
  nextDue: ISODate;
  intervalDays: number;
  repetitions: number;
  confidence: number; // 1-5
}

/* ── Current Affairs Vault ───────────────────────────────────── */

export type CACategory =
  | "Polity"
  | "Economy"
  | "Environment"
  | "International"
  | "Science & Tech"
  | "Society"
  | "Schemes"
  | "Reports & Indices"
  | "Geography"
  | "Misc";

export interface CurrentAffair {
  id: string;
  date: ISODate;
  title: string;
  source: string;
  category: CACategory;
  tags: string[];
  summary: string;
  prelimsRelevant: boolean;
  mainsRelevant: boolean;
  linkedSubjectId?: string;
  bookmarked: boolean;
}

/* ── Mistake Tracker ─────────────────────────────────────────── */

/** The six UPSC error categories — every mistake is one of these. */
export type MistakeCategory =
  | "Conceptual"
  | "Factual"
  | "Guessing"
  | "Revision Failure"
  | "Time Pressure"
  | "Careless";

/** Review lifecycle: a mistake graduates to "Mastered" after repeated recall. */
export type MistakeStatus = "Open" | "Reviewing" | "Mastered";

export interface Mistake {
  id: string;
  date: ISODate; // when the mistake was made
  subjectId: string;
  topic: string;
  category: MistakeCategory;

  /* the learning asset */
  question?: string;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  source?: string;

  /* spaced-repetition review workflow */
  status: MistakeStatus;
  reviewCount: number;
  lastReviewed?: ISODate;
  nextReview: ISODate;
  intervalDays: number;
}

/* ── Habits / Sleep / Exercise ───────────────────────────────── */

export interface Habit {
  id: string;
  name: string;
  cadence: "daily" | "weekly";
  icon?: string;
  createdOn: ISODate;
  targetPerWeek?: number;
  archived?: boolean;
  log: Record<ISODate, boolean>;
}

export interface SleepLog {
  id: string;
  date: ISODate;
  hours: number;
  quality: number; // 1-5
  bedtime?: string;
  wakeup?: string;
}

export type ExerciseType =
  | "Run"
  | "Walk"
  | "Gym"
  | "Yoga"
  | "Cycling"
  | "Sports"
  | "Other";

export interface ExerciseLog {
  id: string;
  date: ISODate;
  type: ExerciseType;
  minutes: number;
  intensity: number; // 1-5
  note?: string;
}

/* ── Life Dashboard (unified daily life log) ─────────────────── */

/** One record per day capturing every lifestyle metric, so daily/weekly
 *  analytics and cross-metric correlations all read from one place. */
export interface LifeEntry {
  id: string;
  date: ISODate; // unique per day
  sleepHours: number;
  sleepQuality: number; // 1-5
  bedtime?: string;
  wakeTime?: string;
  walkKm: number;
  runKm: number;
  exerciseMinutes: number;
  exerciseType?: ExerciseType;
  waterLiters: number;
  meditationMin: number;
  weightKg?: number;
  screenTimeMin: number;
  deepWorkHours: number;
}

/* ── Goals ───────────────────────────────────────────────────── */

export type GoalHorizon =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Quarterly"
  | "Long-term";
export type GoalStatus = "Active" | "Completed" | "Missed" | "Paused";

export interface Goal {
  id: string;
  title: string;
  horizon: GoalHorizon;
  metricLabel?: string;
  target?: number;
  current?: number;
  unit?: string;
  deadline?: ISODate;
  status: GoalStatus;
  createdOn: ISODate;
  linkedSubjectId?: string;
}

/* ── Books ───────────────────────────────────────────────────── */

export type BookStatus = "To Read" | "Reading" | "Completed" | "Reference";

export interface Book {
  id: string;
  title: string;
  author: string;
  subjectId?: string;
  paper?: PaperCode;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  rating?: number; // 1-5
  startedOn?: ISODate;
  finishedOn?: ISODate;
  isStandard?: boolean; // a "standard" UPSC reference book
}

/* ── Milestones / Timeline ───────────────────────────────────── */

export type MilestoneType =
  | "Start"
  | "Exam"
  | "Achievement"
  | "Phase"
  | "Personal"
  | "Setback"
  | "Selection";

export interface Milestone {
  id: string;
  date: ISODate;
  title: string;
  type: MilestoneType;
  description?: string;
  pinned?: boolean;
}

/* ── Emotional Reflection Journal ────────────────────────────── */

export interface Reflection {
  id: string;
  date: ISODate;
  prompt?: string;
  content: string;
  mood: number; // 1-5
  gratitude?: string[];
}

/* ── Reviews (weekly / monthly / yearly) ─────────────────────── */

export type ReviewType = "Weekly" | "Monthly" | "Yearly";

export interface Review {
  id: string;
  type: ReviewType;
  periodLabel: string;
  startDate: ISODate;
  endDate: ISODate;
  totalHours?: number;
  mocksTaken?: number;
  rating?: number; // 1-5
  wins?: string[];
  struggles?: string[];
  lessons?: string[];
  nextFocus?: string[];
}

/* ── Knowledge Graph ─────────────────────────────────────────── */

/**
 * An Obsidian-style link between two topic nodes. `source` and `target` are
 * Topic ids ("<subjectId>-t<index>"). Subject→topic containment edges are
 * derived at render time rather than stored, so the graph stays in sync with
 * the syllabus. Topic completion status, confidence and revision counts live
 * on the Topic itself and power the node styling and analytics.
 */
export interface TopicLink {
  id: string;
  source: string;
  target: string;
  relation?: string; // e.g. "leads to", "related", "prerequisite", "contrast"
  createdOn?: ISODate;
}

/* ── Selection Journey Archive ───────────────────────────────── */

export type StageStatus =
  | "Locked"
  | "In Progress"
  | "Cleared"
  | "Awaiting Result"
  | "Not Cleared";

export interface SelectionStage {
  id: string;
  name: string;
  attempt: string;
  status: StageStatus;
  date?: ISODate;
  score?: string;
  notes?: string;
}

/* ── Profile ─────────────────────────────────────────────────── */

export interface Profile {
  name: string;
  tagline?: string;
  mission?: string;
  targetExam: string;
  examDate: ISODate;
  attemptNumber: number;
  optionalSubject: string;
  startDate: ISODate;
  dailyHourTarget: number;
}

/* ── Root state ──────────────────────────────────────────────── */

export interface ChronicleData {
  profile: Profile;
  subjects: Subject[];
  journal: JournalEntry[];
  mocks: MockTest[];
  revisions: RevisionItem[];
  currentAffairs: CurrentAffair[];
  mistakes: Mistake[];
  habits: Habit[];
  sleep: SleepLog[];
  exercise: ExerciseLog[];
  lifeLog: LifeEntry[];
  goals: Goal[];
  books: Book[];
  milestones: Milestone[];
  reflections: Reflection[];
  reviews: Review[];
  topicLinks: TopicLink[];
  selection: SelectionStage[];
}
