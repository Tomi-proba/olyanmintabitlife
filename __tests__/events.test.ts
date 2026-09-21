import { Rng } from '../engine/rng';
import { rollEvent, buildEventContext } from '../engine/events';
import { newGame } from '../engine/newGame';
import { EVENTS } from '../data/events';
import type { EventDefinition } from '../engine/types';

describe('EVENTS data', () => {
  it('has at least 50 events', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(50);
  });

  it('has unique ids across events and their choices', () => {
    const ids = EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const event of EVENTS) {
      const choiceIds = event.choices.map((c) => c.id);
      expect(new Set(choiceIds).size).toBe(choiceIds.length);
    }
  });

  it('every event has at least one choice', () => {
    for (const event of EVENTS) {
      expect(event.choices.length).toBeGreaterThan(0);
    }
  });

  it('every event has a sane age range and probability', () => {
    for (const event of EVENTS) {
      if (event.condition.minAge !== undefined && event.condition.maxAge !== undefined) {
        expect(event.condition.minAge).toBeLessThanOrEqual(event.condition.maxAge);
      }
      expect(event.probability).toBeGreaterThan(0);
      expect(event.probability).toBeLessThanOrEqual(1);
      expect(event.weight).toBeGreaterThan(0);
    }
  });
});

describe('rollEvent', () => {
  it('never returns an event whose age condition excludes the current age', () => {
    const rng = new Rng(1);
    let state = newGame({ firstName: 'Sam' }, 1);
    for (let i = 0; i < 80; i++) {
      const event = rollEvent(rng, EVENTS, state);
      if (event) {
        const def = EVENTS.find((e) => e.id === event.id) as EventDefinition;
        if (def.condition.minAge !== undefined) expect(state.player.age).toBeGreaterThanOrEqual(def.condition.minAge);
        if (def.condition.maxAge !== undefined) expect(state.player.age).toBeLessThanOrEqual(def.condition.maxAge);
      }
      state = { ...state, player: { ...state.player, age: state.player.age + 1 } };
    }
  });

  it('fills {name} in the event text with the player first name', () => {
    const rng = new Rng(2);
    const state = newGame({ firstName: 'Zephyra' }, 2);
    let found = false;
    let r = rng;
    let s = state;
    for (let i = 0; i < 100 && !found; i++) {
      const event = rollEvent(r, EVENTS, s);
      if (event) {
        expect(event.text).not.toContain('{name}');
        expect(event.text).not.toContain('{subject}');
        found = true;
      }
    }
  });

  it('only targets a subject when a matching family member is alive', () => {
    const rng = new Rng(3);
    let state = newGame({ firstName: 'Rio' }, 3);
    // Kill everyone off.
    state = { ...state, family: state.family.map((m) => ({ ...m, alive: false })) };
    for (let i = 0; i < 50; i++) {
      const event = rollEvent(rng, EVENTS, state);
      if (event) {
        expect(event.subjectId).toBeUndefined();
      }
    }
  });

  it('buildEventContext reflects living family composition', () => {
    const state = newGame({ firstName: 'Kai' }, 4);
    const ctx = buildEventContext(state);
    expect(ctx.hasAnyLivingFamily).toBe(state.family.some((m) => m.alive));
  });
});
