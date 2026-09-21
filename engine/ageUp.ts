import type { GameState, Stats, FeedEntry } from './types';
import { Rng } from './rng';
import { makeId } from './id';
import { rollDeath } from './death';
import { ageFamily } from './family';
import { rollEvent } from './events';
import { applyEffects } from './effects';
import { applyYearlyEducationUpdate } from './education';
import { applyYearlyJobDrift } from './career';
import { applyYearlyFinances } from './money';
import { EVENTS } from '../data/events';

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Baseline yearly stat drift from aging alone. Random events (see
 * engine/events.ts) layer further changes on top of this via the same
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

/** Rolls the death check for the current year and, if it fires, finalizes the life. */
function finalizeYear(state: GameState, rng: Rng, yearFeed: FeedEntry[]): GameState {
  const death = rollDeath(rng, state.player.age, state.player.stats.health);
  const feed = [...yearFeed];

  if (death.died) {
    feed.push(
      makeFeedEntry(
        rng,
        state.player.age,
        state.yearsLived + 1,
        `${state.player.firstName} ${state.player.lastName} died at age ${state.player.age}. Cause of death: ${death.cause}.`,
        'system',
      ),
    );
  }

  return {
    ...state,
    rngState: rng.state,
    yearsLived: state.yearsLived + 1,
    feed: [...state.feed, ...feed],
    isAlive: !death.died,
    deathCause: death.died ? death.cause : state.deathCause,
  };
}

/**
 * Advances the game state by exactly one year. Pure function: returns a new
 * GameState and never mutates the one it was given. If the year's random
 * event needs a player decision, the year is left unfinished — age, stats,
 * and family aging are applied, but death isn't rolled and yearsLived isn't
 * incremented until resolveEventChoice() completes it.
 */
export function ageUp(state: GameState): GameState {
  if (!state.isAlive || state.pendingEvent) return state;

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

  const { family: agedFamily, deathFeedTexts } = ageFamily(rng, state.family);
  for (const text of deathFeedTexts) {
    feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, text, 'system'));
  }

  const householdBefore = [...(state.partner ? [state.partner] : []), ...state.children];
  const { family: agedHousehold, deathFeedTexts: householdDeathTexts } = ageFamily(rng, householdBefore);
  for (const text of householdDeathTexts) {
    feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, text, 'system'));
  }
  const nextPartner = state.partner ? agedHousehold.find((m) => m.id === state.partner!.id) : undefined;
  const nextChildren = agedHousehold.filter((m) => m.role === 'child');
  const partnerJustDied = !!(state.partner && nextPartner && !nextPartner.alive);

  let working: GameState = {
    ...state,
    player: { ...state.player, age: nextAge, stats: newStats },
    family: agedFamily,
    partner: nextPartner,
    children: nextChildren,
    flags: partnerJustDied ? { ...state.flags, married: false, dating: false, widowed: true } : state.flags,
  };

  const educationResult = applyYearlyEducationUpdate(working, rng);
  working = educationResult.state;
  for (const text of educationResult.feedTexts) {
    feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, text, 'system'));
  }

  const jobDrift = applyYearlyJobDrift(working, rng);
  working = jobDrift.state;
  for (const text of jobDrift.feedTexts) {
    feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, text, 'system'));
  }

  const financeResult = applyYearlyFinances(working, rng);
  working = financeResult.state;
  for (const text of financeResult.feedTexts) {
    feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, text));
  }

  const event = rollEvent(rng, EVENTS, working);
  if (event) {
    if (event.choices.length <= 1) {
      feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, event.text));
      const onlyChoice = event.choices[0];
      if (onlyChoice) {
        working = applyEffects(working, onlyChoice.effects, event.subjectId);
        if (onlyChoice.resultText) {
          feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, onlyChoice.resultText));
        }
      }
    } else {
      feed.push(makeFeedEntry(rng, nextAge, state.yearsLived + 1, event.text, 'choice'));
      return {
        ...working,
        rngState: rng.state,
        feed: [...state.feed, ...feed],
        pendingEvent: event,
      };
    }
  }

  return finalizeYear(working, rng, feed);
}

/** Applies the player's chosen response to state.pendingEvent, then finishes the year it deferred. */
export function resolveEventChoice(state: GameState, choiceId: string): GameState {
  if (!state.pendingEvent) return state;

  const rng = new Rng(state.rngState);
  const event = state.pendingEvent;
  const choice = event.choices.find((c) => c.id === choiceId) ?? event.choices[0];

  const applied = applyEffects(state, choice.effects, event.subjectId);
  const working: GameState = { ...applied, pendingEvent: undefined };

  const feed: FeedEntry[] = [];
  if (choice.resultText) {
    feed.push(makeFeedEntry(rng, state.player.age, state.yearsLived + 1, choice.resultText));
  }

  return finalizeYear(working, rng, feed);
}
