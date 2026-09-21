import { applyEffects } from '../engine/effects';
import { newGame } from '../engine/newGame';

describe('applyEffects', () => {
  it('applies stat/money/karma deltas and clamps stats to 0-100', () => {
    const state = newGame({ firstName: 'Ori' }, 1);
    const boosted = applyEffects(state, { happiness: 1000, money: 50, karma: 5 });
    expect(boosted.player.stats.happiness).toBe(100);
    expect(boosted.player.money).toBe(state.player.money + 50);
    expect(boosted.player.hidden.karma).toBe(5);
  });

  it('applies a relationship delta to the named subject only', () => {
    const state = newGame({ firstName: 'Ori' }, 2);
    const subject = state.family[0];
    const next = applyEffects(state, { relationship: 10 }, subject.id);
    const updatedSubject = next.family.find((m) => m.id === subject.id)!;
    expect(updatedSubject.relationship).toBe(Math.min(100, subject.relationship + 10));
    const others = next.family.filter((m) => m.id !== subject.id);
    others.forEach((m, i) => expect(m.relationship).toBe(state.family.filter((f) => f.id !== subject.id)[i].relationship));
  });

  it('merges flags without dropping existing ones', () => {
    const state = newGame({ firstName: 'Ori' }, 3);
    const withFlagA = applyEffects(state, { flags: { a: true } });
    const withFlagB = applyEffects(withFlagA, { flags: { b: 5 } });
    expect(withFlagB.flags).toEqual({ a: true, b: 5 });
  });

  it('is a no-op when effects is undefined', () => {
    const state = newGame({ firstName: 'Ori' }, 4);
    expect(applyEffects(state, undefined)).toBe(state);
  });
});
