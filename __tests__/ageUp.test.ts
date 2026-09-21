import { newGame } from '../engine/newGame';
import { ageUp, resolveEventChoice } from '../engine/ageUp';
import type { GameState } from '../engine/types';

/** Plays out ageUp() plus, if it produced a pendingEvent, auto-picks the first choice. */
function advanceYear(state: GameState): GameState {
  const afterAgeUp = ageUp(state);
  if (afterAgeUp.pendingEvent) {
    return resolveEventChoice(afterAgeUp, afterAgeUp.pendingEvent.choices[0].id);
  }
  return afterAgeUp;
}

describe('ageUp', () => {
  it('increments age by exactly one and yearsLived by one, once any event choice resolves', () => {
    const state = newGame({ firstName: 'Riko' }, 1);
    const next = advanceYear(state);
    expect(next.player.age).toBe(state.player.age + 1);
    expect(next.yearsLived).toBe(state.yearsLived + 1);
  });

  it('does not mutate the state it was given (pure function)', () => {
    const state = newGame({ firstName: 'Riko' }, 1);
    const snapshotAge = state.player.age;
    const snapshotFeedLength = state.feed.length;
    ageUp(state);
    expect(state.player.age).toBe(snapshotAge);
    expect(state.feed.length).toBe(snapshotFeedLength);
  });

  it('appends at least one feed entry for the new age', () => {
    const state = newGame({ firstName: 'Riko' }, 2);
    const next = ageUp(state);
    expect(next.feed.length).toBeGreaterThan(state.feed.length);
    const newEntries = next.feed.slice(state.feed.length);
    expect(newEntries.every((e) => e.age === next.player.age)).toBe(true);
  });

  it('leaves a pendingEvent unresolved until resolveEventChoice is called, then does not double-advance the year', () => {
    const state = newGame({ firstName: 'Riko' }, 1);
    const afterAgeUp = ageUp(state);
    if (afterAgeUp.pendingEvent) {
      expect(afterAgeUp.yearsLived).toBe(state.yearsLived);
      // Calling ageUp again while a choice is pending must be a no-op.
      expect(ageUp(afterAgeUp)).toBe(afterAgeUp);
      const resolved = resolveEventChoice(afterAgeUp, afterAgeUp.pendingEvent.choices[0].id);
      expect(resolved.pendingEvent).toBeUndefined();
      expect(resolved.yearsLived).toBe(state.yearsLived + 1);
    }
  });

  it('keeps all stats within 0-100 after many years', () => {
    let state = newGame({ firstName: 'Riko' }, 3);
    for (let i = 0; i < 60 && state.isAlive; i++) {
      state = advanceYear(state);
      for (const value of Object.values(state.player.stats)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it('is a no-op once the character has died', () => {
    let state = newGame({ firstName: 'Riko' }, 4);
    for (let i = 0; i < 200 && state.isAlive; i++) {
      state = advanceYear(state);
    }
    expect(state.isAlive).toBe(false);
    const afterDeath = ageUp(state);
    expect(afterDeath).toBe(state);
  });

  it('eventually ends every life in death given enough years', () => {
    let state = newGame({ firstName: 'Riko' }, 5);
    let years = 0;
    while (state.isAlive && years < 500) {
      state = advanceYear(state);
      years++;
    }
    expect(state.isAlive).toBe(false);
    expect(state.deathCause).toBeDefined();
  });

  it('produces the same outcome for the same seed (reproducible runs)', () => {
    const runOnce = (seed: number) => {
      let state = newGame({ firstName: 'Riko', lastName: 'Vale', gender: 'female' }, seed);
      for (let i = 0; i < 30; i++) {
        state = advanceYear(state);
      }
      return state;
    };
    const a = runOnce(777);
    const b = runOnce(777);
    expect(a).toEqual(b);
  });
});
