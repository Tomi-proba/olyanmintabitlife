import { newGame } from '../engine/newGame';
import { buildLifeSummary } from '../engine/lifeSummary';

describe('newGame', () => {
  it('creates an alive, age-0 character with a birth feed entry', () => {
    const state = newGame({ firstName: 'Mika' }, 1);
    expect(state.isAlive).toBe(true);
    expect(state.player.age).toBe(0);
    expect(state.feed).toHaveLength(1);
    expect(state.feed[0].text).toContain('Mika');
  });

  it('uses the provided seed deterministically', () => {
    const a = newGame({ firstName: 'Mika' }, 42);
    const b = newGame({ firstName: 'Mika' }, 42);
    expect(a).toEqual(b);
  });
});

describe('buildLifeSummary', () => {
  it('reflects unemployed/no-kids defaults for a fresh game', () => {
    const state = newGame({ firstName: 'Mika' }, 9);
    const summary = buildLifeSummary(state);
    expect(summary.career).toBe('Unemployed');
    expect(summary.kids).toBe(0);
    expect(summary.causeOfDeath).toBe('Unknown');
  });
});
