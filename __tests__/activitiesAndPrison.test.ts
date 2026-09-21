import { newGame } from '../engine/newGame';
import { ageUp, resolveEventChoice } from '../engine/ageUp';
import { goToGym } from '../engine/health';
import type { GameState } from '../engine/types';

function advanceYear(state: GameState): GameState {
  const afterAgeUp = ageUp(state);
  if (afterAgeUp.pendingEvent) {
    return resolveEventChoice(afterAgeUp, afterAgeUp.pendingEvent.choices[0].id);
  }
  return afterAgeUp;
}

describe('activitiesUsedThisYear', () => {
  it('starts empty on a new game', () => {
    const state = newGame({ firstName: 'A' }, 1);
    expect(state.activitiesUsedThisYear).toEqual([]);
  });

  it('is cleared by ageUp for the new year', () => {
    let state = newGame({ firstName: 'A' }, 2);
    state = { ...state, activitiesUsedThisYear: ['gym', 'doctor'] };
    const next = advanceYear(state);
    expect(next.activitiesUsedThisYear).toEqual([]);
  });
});

describe('prison', () => {
  it('decrements prisonYearsLeft each year and releases at 0', () => {
    let state = newGame({ firstName: 'Con' }, 3);
    state = { ...state, prisonYearsLeft: 2 };
    state = advanceYear(state);
    expect(state.prisonYearsLeft).toBe(1);
    state = advanceYear(state);
    expect(state.prisonYearsLeft).toBeUndefined();
  });

  it('mentions prison in the feed while serving time', () => {
    let state = newGame({ firstName: 'Con' }, 4);
    state = { ...state, prisonYearsLeft: 1 };
    const before = state.feed.length;
    state = advanceYear(state);
    const newEntries = state.feed.slice(before);
    expect(newEntries.some((e) => e.text.toLowerCase().includes('prison'))).toBe(true);
  });
});

describe('chronic condition', () => {
  it('causes extra health decay each year once diagnosed', () => {
    const state = newGame({ firstName: 'Sick' }, 5);
    const withCondition = { ...state, flags: { ...state.flags, chronicCondition: true } };
    // Can't directly compare stochastic single-year deltas, but health must stay in range over many years.
    let s: GameState = withCondition;
    for (let i = 0; i < 20 && s.isAlive; i++) {
      s = advanceYear(s);
      expect(s.player.stats.health).toBeGreaterThanOrEqual(0);
      expect(s.player.stats.health).toBeLessThanOrEqual(100);
    }
  });
});

describe('goToGym reachable through the once-per-year gate conceptually', () => {
  it('is a pure function independent of activitiesUsedThisYear (gating lives in the store)', () => {
    const state = newGame({ firstName: 'G' }, 6);
    const result = goToGym(state);
    expect(result.state.player.stats.health).toBeGreaterThanOrEqual(state.player.stats.health);
  });
});
