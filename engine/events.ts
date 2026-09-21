import type {
  EventCondition,
  EventDefinition,
  EventSubjectRole,
  FamilyMember,
  GameEvent,
  GameState,
  Gender,
} from './types';
import type { Rng } from './rng';
import { roleLabel } from './family';

export interface EventContext {
  age: number;
  gender: Gender;
  flags: Record<string, boolean | number | string>;
  hasLivingMother: boolean;
  hasLivingFather: boolean;
  hasLivingSibling: boolean;
  hasAnyLivingFamily: boolean;
}

export function buildEventContext(state: GameState): EventContext {
  const living = state.family.filter((m) => m.alive);
  return {
    age: state.player.age,
    gender: state.player.gender,
    flags: state.flags,
    hasLivingMother: living.some((m) => m.role === 'mother'),
    hasLivingFather: living.some((m) => m.role === 'father'),
    hasLivingSibling: living.some((m) => m.role === 'sibling'),
    hasAnyLivingFamily: living.length > 0,
  };
}

function subjectAvailable(ctx: EventContext, requires: EventSubjectRole | undefined): boolean {
  if (!requires) return true;
  switch (requires) {
    case 'mother':
      return ctx.hasLivingMother;
    case 'father':
      return ctx.hasLivingFather;
    case 'parent':
      return ctx.hasLivingMother || ctx.hasLivingFather;
    case 'sibling':
      return ctx.hasLivingSibling;
    case 'any-family':
      return ctx.hasAnyLivingFamily;
    default:
      return true;
  }
}

function conditionMatches(condition: EventCondition, ctx: EventContext): boolean {
  if (condition.minAge !== undefined && ctx.age < condition.minAge) return false;
  if (condition.maxAge !== undefined && ctx.age > condition.maxAge) return false;
  if (condition.genders && !condition.genders.includes(ctx.gender)) return false;
  if (condition.requiredFlags) {
    for (const [key, value] of Object.entries(condition.requiredFlags)) {
      if (ctx.flags[key] !== value) return false;
    }
  }
  if (!subjectAvailable(ctx, condition.requiresSubject)) return false;
  return true;
}

function pickSubject(rng: Rng, family: FamilyMember[], role: EventSubjectRole | undefined): FamilyMember | undefined {
  if (!role) return undefined;
  const living = family.filter((m) => m.alive);
  let pool: FamilyMember[];
  switch (role) {
    case 'mother':
      pool = living.filter((m) => m.role === 'mother');
      break;
    case 'father':
      pool = living.filter((m) => m.role === 'father');
      break;
    case 'parent':
      pool = living.filter((m) => m.role === 'mother' || m.role === 'father');
      break;
    case 'sibling':
      pool = living.filter((m) => m.role === 'sibling');
      break;
    case 'any-family':
      pool = living;
      break;
    default:
      pool = [];
  }
  if (pool.length === 0) return undefined;
  return rng.pick(pool);
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

/**
 * Picks one eligible event for this year, or null if none fire. Each
 * eligible event independently rolls against its own `probability`; if more
 * than one "fires" this way, `weight` breaks the tie.
 */
export function rollEvent(
  rng: Rng,
  pool: readonly EventDefinition[],
  state: GameState,
): GameEvent | null {
  const ctx = buildEventContext(state);
  const eligible = pool.filter((def) => conditionMatches(def.condition, ctx));
  const candidates = eligible.filter((def) => rng.chance(def.probability));
  if (candidates.length === 0) return null;

  const chosen = rng.weightedPick(candidates, (def) => def.weight);
  const subject = pickSubject(rng, state.family, chosen.condition.requiresSubject);

  const vars: Record<string, string> = {
    name: state.player.firstName,
    subject: subject ? `your ${roleLabel(subject.role)} ${subject.firstName}` : 'someone',
    subjectName: subject?.firstName ?? '',
  };

  return {
    id: chosen.id,
    text: fillTemplate(chosen.text, vars),
    subjectId: subject?.id,
    subjectName: subject?.firstName,
    subjectRole: subject?.role,
    choices: chosen.choices.map((c) => ({
      id: c.id,
      label: fillTemplate(c.label, vars),
      effects: c.effects,
      resultText: c.resultText ? fillTemplate(c.resultText, vars) : undefined,
    })),
  };
}
