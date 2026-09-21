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
import { isEnrolled } from './education';

export interface EventContext {
  age: number;
  gender: Gender;
  flags: Record<string, boolean | number | string>;
  hasLivingMother: boolean;
  hasLivingFather: boolean;
  hasLivingSibling: boolean;
  hasAnyLivingFamily: boolean;
  hasLivingPartner: boolean;
  hasLivingChild: boolean;
  hasJob: boolean;
  isEnrolled: boolean;
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
    hasLivingPartner: !!state.partner && state.partner.alive,
    hasLivingChild: state.children.some((c) => c.alive),
    hasJob: !!state.job,
    isEnrolled: isEnrolled(state.education.stage),
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
    case 'partner':
      return ctx.hasLivingPartner;
    case 'child':
      return ctx.hasLivingChild;
    case 'any-person':
      return ctx.hasAnyLivingFamily || ctx.hasLivingPartner || ctx.hasLivingChild;
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
  if (condition.requiresJob && !ctx.hasJob) return false;
  if (condition.requiresNoJob && ctx.hasJob) return false;
  if (condition.requiresChildren && !ctx.hasLivingChild) return false;
  if (condition.requiresPartner && !ctx.hasLivingPartner) return false;
  if (condition.requiresEnrolled && !ctx.isEnrolled) return false;
  if (!subjectAvailable(ctx, condition.requiresSubject)) return false;
  return true;
}

function peoplePool(state: GameState, role: EventSubjectRole): FamilyMember[] {
  const livingFamily = state.family.filter((m) => m.alive);
  const livingPartner = state.partner && state.partner.alive ? [state.partner] : [];
  const livingChildren = state.children.filter((c) => c.alive);

  switch (role) {
    case 'mother':
      return livingFamily.filter((m) => m.role === 'mother');
    case 'father':
      return livingFamily.filter((m) => m.role === 'father');
    case 'parent':
      return livingFamily.filter((m) => m.role === 'mother' || m.role === 'father');
    case 'sibling':
      return livingFamily.filter((m) => m.role === 'sibling');
    case 'any-family':
      return livingFamily;
    case 'partner':
      return livingPartner;
    case 'child':
      return livingChildren;
    case 'any-person':
      return [...livingFamily, ...livingPartner, ...livingChildren];
    default:
      return [];
  }
}

function pickSubject(rng: Rng, state: GameState, role: EventSubjectRole | undefined): FamilyMember | undefined {
  if (!role) return undefined;
  const pool = peoplePool(state, role);
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
  const subject = pickSubject(rng, state, chosen.condition.requiresSubject);

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
