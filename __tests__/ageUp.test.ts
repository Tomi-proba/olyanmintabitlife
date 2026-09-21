import { newGame } from '../engine/newGame';
import { ageUp } from '../engine/ageUp';

describe('ageUp', () => {
  it('increments age by exactly one and yearsLived by one', () => {
    const state = newGame({ firstName: 'Riko' }, 1);
    const next = ageUp(state);
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

  it('keeps all stats within 0-100 after many years', () => {
    let state = newGame({ firstName: 'Riko' }, 3);
    for (let i = 0; i < 60 && state.isAlive; i++) {
      state = ageUp(state);
      for (const value of Object.values(state.player.stats)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it('is a no-op once the character has died', () => {
    let state = newGame({ firstName: 'Riko' }, 4);
    for (let i = 0; i < 200 && state.isAlive; i++) {
      state = ageUp(state);
    }
    expect(state.isAlive).toBe(false);
    const afterDeath = ageUp(state);
    expect(afterDeath).toBe(state);
  });

  it('eventually ends every life in death given enough years', () => {
    let state = newGame({ firstName: 'Riko' }, 5);
    let years = 0;
    while (state.isAlive && years < 500) {
      state = ageUp(state);
      years++;
    }
    expect(state.isAlive).toBe(false);
    expect(state.deathCause).toBeDefined();
  });

  it('produces the same outcome for the same seed (reproducible runs)', () => {
    const runOnce = (seed: number) => {
      let state = newGame({ firstName: 'Riko', lastName: 'Vale', gender: 'female' }, seed);
      for (let i = 0; i < 30; i++) {
        state = ageUp(state);
      }
      return state;
    };
    const a = runOnce(777);
    const b = runOnce(777);
    expect(a).toEqual(b);
  });
});
