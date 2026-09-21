import { newGame } from '../engine/newGame';
import {
  browseDatingApp,
  startDating,
  passOnProspect,
  breakUp,
  proposeMarriage,
  divorce,
  cheatOnPartner,
  haveChild,
  getAllPeople,
  applyPeopleUpdate,
} from '../engine/relationships';
import type { GameState } from '../engine/types';

function adultState(seed: number) {
  const state = newGame({ firstName: 'Romeo' }, seed);
  return { ...state, player: { ...state.player, age: 25 } };
}

describe('dating app flow', () => {
  it('refuses to browse before the minimum age', () => {
    const state = newGame({ firstName: 'Young' }, 1);
    const child = { ...state, player: { ...state.player, age: 10 } };
    const result = browseDatingApp(child);
    expect(result.state.datingProspect).toBeUndefined();
  });

  it('produces a prospect for a qualified adult', () => {
    const state = adultState(2);
    const result = browseDatingApp(state);
    expect(result.state.datingProspect).toBeDefined();
    expect(result.state.datingProspect!.role).toBe('partner');
  });

  it('startDating moves the prospect into state.partner', () => {
    const state = adultState(3);
    const browsed = browseDatingApp(state).state;
    const result = startDating(browsed);
    expect(result.state.partner).toEqual(browsed.datingProspect);
    expect(result.state.datingProspect).toBeUndefined();
    expect(result.state.flags.dating).toBe(true);
  });

  it('passOnProspect clears the prospect without setting a partner', () => {
    const state = adultState(4);
    const browsed = browseDatingApp(state).state;
    const result = passOnProspect(browsed);
    expect(result.state.datingProspect).toBeUndefined();
    expect(result.state.partner).toBeUndefined();
  });

  it('refuses to browse while already partnered', () => {
    const state = adultState(5);
    const dating = startDating(browseDatingApp(state).state).state;
    const result = browseDatingApp(dating);
    expect(result.state.datingProspect).toBeUndefined();
  });
});

describe('marriage and divorce', () => {
  function datingState(seed: number) {
    const state = adultState(seed);
    return startDating(browseDatingApp(state).state).state;
  }

  it('proposeMarriage requires a partner', () => {
    const state = adultState(6);
    const result = proposeMarriage(state);
    expect(result.state.flags.married).toBeFalsy();
  });

  it('a high-relationship proposal is very likely to succeed', () => {
    const state = datingState(7);
    const boosted = { ...state, partner: { ...state.partner!, relationship: 95 } };
    const result = proposeMarriage(boosted);
    expect(result.state.flags.married).toBe(true);
  });

  it('divorce requires being married and splits money', () => {
    const state = datingState(8);
    const married = { ...state, flags: { ...state.flags, married: true }, player: { ...state.player, money: 10000 } };
    const result = divorce(married);
    expect(result.state.partner).toBeUndefined();
    expect(result.state.flags.married).toBe(false);
    expect(result.state.player.money).toBeLessThan(10000);
  });

  it('divorce is a no-op without a marriage', () => {
    const state = datingState(9);
    const result = divorce(state);
    expect(result.state.partner).toBeDefined();
  });
});

describe('breakUp and cheatOnPartner', () => {
  function datingState(seed: number) {
    const state = adultState(seed);
    return startDating(browseDatingApp(state).state).state;
  }

  it('breakUp clears the partner and lowers happiness', () => {
    const state = datingState(10);
    const result = breakUp(state);
    expect(result.state.partner).toBeUndefined();
    expect(result.state.player.stats.happiness).toBeLessThanOrEqual(state.player.stats.happiness);
  });

  it('cheatOnPartner either ends the relationship or dents karma, and always advances rng', () => {
    const state = datingState(11);
    const result = cheatOnPartner(state);
    expect(result.state.rngState).not.toBe(state.rngState);
    expect(result.state.player.hidden.karma).toBeLessThan(state.player.hidden.karma);
  });
});

describe('haveChild', () => {
  it('requires a living partner', () => {
    const state = adultState(12);
    const result = haveChild(state);
    expect(result.state.children).toHaveLength(0);
  });

  it('adds a new child with high starting relationship', () => {
    const state = adultState(13);
    const dating = startDating(browseDatingApp(state).state).state;
    const result = haveChild(dating);
    expect(result.state.children).toHaveLength(1);
    expect(result.state.children[0].role).toBe('child');
    expect(result.state.children[0].age).toBe(0);
    expect(result.state.children[0].relationship).toBeGreaterThanOrEqual(70);
  });
});

describe('getAllPeople / applyPeopleUpdate', () => {
  it('round-trips a relationship change back into the right bucket', () => {
    const state = adultState(14);
    const dating = startDating(browseDatingApp(state).state).state;
    const withChild = haveChild(dating).state;

    const people = getAllPeople(withChild);
    expect(people.length).toBe(withChild.family.length + 1 + withChild.children.length);

    const updated = people.map((p) => ({ ...p, relationship: 1 }));
    const result: GameState = applyPeopleUpdate(withChild, updated);

    expect(result.partner!.relationship).toBe(1);
    expect(result.children.every((c) => c.relationship === 1)).toBe(true);
    expect(result.family.every((f) => f.relationship === 1)).toBe(true);
  });
});
