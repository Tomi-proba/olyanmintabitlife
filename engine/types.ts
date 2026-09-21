/**
 * Core engine types. Pure TypeScript — no UI or platform imports, so this
 * module (and everything under /engine) can be unit tested with Jest in
 * isolation.
 *
 * Fields for systems that arrive in later phases (job, education, family,
 * relationships, health, crime, achievements) are declared now so the
 * GameState shape doesn't need breaking changes later, but most stay
 * empty/undefined until their phase implements them.
 */

export type Gender = 'male' | 'female';

export interface Stats {
  happiness: number; // 0-100
  health: number; // 0-100
  smarts: number; // 0-100
  looks: number; // 0-100
}

export interface HiddenStats {
  karma: number; // -100..100, not shown to the player
}

export type RelationshipRole =
  | 'mother'
  | 'father'
  | 'sibling'
  | 'partner'
  | 'child'
  | 'friend';

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  alive: boolean;
  role: RelationshipRole;
  stats: Stats;
  /** How the player's character feels about this person, 0-100. */
  relationship: number;
  deathCause?: string;
}

export interface Job {
  /** References a JobDefinition.id in /data/jobs.ts. */
  jobId: string;
  title: string;
  field: string;
  tier: number;
  /** 1-3: entry/mid/senior within this job; promotions raise this and salary/title. */
  level: 1 | 2 | 3;
  salary: number;
  yearsWorked: number;
  performance: number; // 0-100
  partTime: boolean;
}

export type EducationStage =
  | 'none'
  | 'preschool'
  | 'elementary'
  | 'middle'
  | 'high'
  | 'university'
  | 'graduated';

export interface EducationState {
  stage: EducationStage;
  grade: number;
  gpa: number; // 0-4
  major?: string;
  expelled?: boolean;
  /** Studied (true) or skipped (false) this year; reset each year by ageUp. */
  studiedThisYear?: boolean;
  /** Years completed so far, only while stage === 'university'. */
  universityYear?: number;
}

export interface Asset {
  id: string;
  type: 'property' | 'car' | 'stock' | 'crypto';
  name: string;
  value: number;
  upkeepPerYear: number;
  /** Purchase price, used to report gain/loss; irrelevant for property/car upkeep math. */
  costBasis: number;
}

export type FeedEntryKind = 'narration' | 'choice' | 'stat' | 'system';

export interface FeedEntry {
  id: string;
  age: number;
  year: number;
  text: string;
  kind: FeedEntryKind;
}

/** Stat/money/relationship/flag deltas a choice (or auto-resolved event) applies. */
export interface EffectSpec {
  happiness?: number;
  health?: number;
  smarts?: number;
  looks?: number;
  money?: number;
  karma?: number;
  /** Applied to the event's subject family member, if it has one. */
  relationship?: number;
  flags?: Record<string, boolean | number | string>;
}

export interface EventChoice {
  id: string;
  label: string;
  effects?: EffectSpec;
  resultText?: string;
}

/** A family role an event can target; the engine picks a living matching member at roll time. */
export type EventSubjectRole = 'mother' | 'father' | 'parent' | 'sibling' | 'any-family';

/** The resolved, ready-to-render event stored on GameState.pendingEvent. */
export interface GameEvent {
  id: string;
  text: string;
  choices: EventChoice[];
  subjectId?: string;
  subjectName?: string;
  subjectRole?: RelationshipRole;
}

/** Declarative conditions gating when an event definition is eligible to roll. */
export interface EventCondition {
  minAge?: number;
  maxAge?: number;
  genders?: Gender[];
  /** State flags that must equal the given value for the event to be eligible. */
  requiredFlags?: Record<string, boolean | number | string>;
  /** Family role the event needs a living instance of (e.g. events about a sibling). */
  requiresSubject?: EventSubjectRole;
}

export interface EventChoiceDefinition {
  id: string;
  label: string;
  effects?: EffectSpec;
  resultText?: string;
}

/**
 * Data-file shape for an event (see /data/events.ts). Pure data — no
 * functions — so events can be authored as plain TS/JSON objects and stay
 * easy to add to without touching engine code.
 */
export interface EventDefinition {
  id: string;
  category: string;
  /** Probability [0,1] this event fires on a given year once it's eligible. */
  probability: number;
  /** Relative weight used to pick among the events that fired this year. */
  weight: number;
  text: string;
  condition: EventCondition;
  choices: EventChoiceDefinition[];
}

export interface Character {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  birthYear: number;
  country: string;
  city: string;
  stats: Stats;
  hidden: HiddenStats;
  money: number;
}

export interface GameState {
  seed: number;
  rngState: number;
  yearsLived: number;
  player: Character;
  family: FamilyMember[];
  partner?: FamilyMember;
  children: FamilyMember[];
  job?: Job;
  education: EducationState;
  assets: Asset[];
  achievements: string[];
  feed: FeedEntry[];
  flags: Record<string, boolean | number | string>;
  isAlive: boolean;
  deathCause?: string;
  pendingEvent?: GameEvent;
}

export interface LifeSummary {
  firstName: string;
  lastName: string;
  ageAtDeath: number;
  netWorth: number;
  career: string;
  kids: number;
  achievements: string[];
  causeOfDeath: string;
}
