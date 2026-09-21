import type { GameState, Stats, FeedEntry } from './types';
import { Rng } from './rng';
import { makeId } from './id';
import { rollDeath } from './death';

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Baseline yearly stat drift from aging alone. Later phases layer random
 * events, activities, and job/school outcomes on top of this via the same
 * Stats shape.
 */
function ageStatDrift(rng: Rng, age: number, stats: Stats): Stats {
  let healthDelta = 0;
  if (age >= 65) healthDelta = -rng.int(2, 5);
  else if (age >= 50) healthDelta = -rng.int(1, 3);
  else if (age >= 30) healthDelta = -rng.int(0, 1);
  else healthDelta = rng.int(-1, 1);

  const happinessDelta = rng.int(-4, 4);

  let smartsDelta = 0;
  if (age < 18) smartsDelta = rng.int(0, 3);
  else if (age < 25) smartsDelta = rng.int(0, 1);
  else smartsDelta = rng.int(-1, 0);

  let looksDelta = 0;
  if (age < 25) looksDelta = rng.int(0, 2);
  else if (age < 45) looksDelta = rng.int(-1, 1);
  else if (age < 65) looksDelta = -rng.int(0, 2);
  else looksDelta = -rng.int(1, 3);

  return {
    health: clampStat(stats.health + healthDelta),
    happiness: clampStat(stats.happiness + happinessDelta),
    smarts: clampStat(stats.smarts + smartsDelta),
    looks: clampStat(stats.looks + looksDelta),
  };
}

function makeFeedEntry(
  rng: Rng,
  age: number,
  year: number,
  text: string,
  kind: FeedEntry['kind'] = 'narration',
): FeedEntry {
  return { id: makeId(rng, 'feed'), age, year, text, kind };
}

const BIRTHDAY_LINES = [
  'turned {age} years old.',
  'celebrated another birthday, now {age}.',
  'blew out {age} candles this year.',
];

const HEALTH_DROP_LINES = [
  "{name}'s health took a noticeable hit this year.",
  '{name} has been feeling run down lately.',
];

const HEALTH_UP_LINES = [
  "{name}'s health improved this year.",
  '{name} has been feeling great lately.',
];

const HAPPINESS_LOW_LINES = [
  '{name} has been feeling pretty down lately.',
  "It hasn't been an easy year for {name}.",
];

const HAPPINESS_HIGH_LINES = [
  '{name} has been in great spirits lately.',
  'This has been a genuinely happy year for {name}.',
];

function fillTemplate(template: string, name: string, age: number): string {
  return template.replace('{name}', name).replace('{age}', String(age));
}

/**
 * Advances the game state by exactly one year. Pure function: returns a new
 * GameState and never mutates the one it was given, so callers (the Zustand
 * store, or a test) fully control persistence and timing.
 */
export function ageUp(state: GameState): GameState {
  if (!state.isAlive) return state;

  const rng = new Rng(state.rngState);
  const nextAge = state.player.age + 1;
  const feed: FeedEntry[] = [];

  const newStats = ageStatDrift(rng, nextAge, state.player.stats);

  feed.push(
    makeFeedEntry(
      rng,
      nextAge,
      state.yearsLived + 1,
      `${state.player.firstName} ${fillTemplate(rng.pick(BIRTHDAY_LINES), state.player.firstName, nextAge)}`,
      'system',
    ),
  );

  const healthDelta = newStats.health - state.player.stats.health;
  if (healthDelta <= -8) {
    feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, fillTemplate(rng.pick(HEALTH_DROP_LINES), state.player.firstName, nextAge)));
  } else if (healthDelta >= 8) {
    feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, fillTemplate(rng.pick(HEALTH_UP_LINES), state.player.firstName, nextAge)));
  }

  if (newStats.happiness <= 25) {
    feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, fillTemplate(rng.pick(HAPPINESS_LOW_LINES), state.player.firstName, nextAge)));
  } else if (newStats.happiness >= 85) {
    feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, fillTemplate(rng.pick(HAPPINESS_HIGH_LINES), state.player.firstName, nextAge)));
  }

  const death = rollDeath(rng, nextAge, newStats.health);

  const player = { ...state.player, age: nextAge, stats: newStats };

  if (death.died) {
    feed.push(
      makeFeedEntry(
        rng,
        nextAge,
        state.yearsLived + 1,
        `${player.firstName} ${player.lastName} died at age ${nextAge}. Cause of death: ${death.cause}.`,
        'system',
      ),
    );
  }

  return {
    ...state,
    rngState: rng.state,
    yearsLived: state.yearsLived + 1,
    player,
    feed: [...state.feed, ...feed],
    isAlive: !death.died,
    deathCause: death.died ? death.cause : state.deathCause,
  };
}
