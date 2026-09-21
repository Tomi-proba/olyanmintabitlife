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
  id: string;
  title: string;
  tier: number;
  salary: number;
  yearsWorked: number;
  performance: number; // 0-100
}

export interface EducationState {
  stage:
    | 'none'
    | 'preschool'
    | 'elementary'
    | 'middle'
    | 'high'
    | 'university'
    | 'graduated';
  grade: number;
  gpa: number; // 0-4
  major?: string;
  expelled?: boolean;
}

export interface Asset {
  id: string;
  type: 'property' | 'car' | 'stock' | 'crypto';
  name: string;
  value: number;
  upkeepPerYear: number;
}

export type FeedEntryKind = 'narration' | 'choice' | 'stat' | 'system';

export interface FeedEntry {
  id: string;
  age: number;
  year: number;
  text: string;
  kind: FeedEntryKind;
}

export interface EventChoice {
  id: string;
  label: string;
  effects?: Partial<{
    happiness: number;
    health: number;
    smarts: number;
    looks: number;
    money: number;
    karma: number;
  }>;
  resultText?: string;
}

export interface GameEvent {
  id: string;
  text: string;
  choices: EventChoice[];
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
