import type { FamilyMember, GameState, Gender } from './types';
import { Rng } from './rng';
import { makeId } from './id';
import { randomStats } from './character';
import { randomFirstName, randomLastName } from '../data/names';

export interface RelationshipActionResult {
  state: GameState;
  feedText: string;
}

const DATING_MIN_AGE = 16;
const MARRIAGE_MIN_AGE = 18;

function otherGender(gender: Gender): Gender {
  return gender === 'male' ? 'female' : 'male';
}

/** Rolls a new prospective partner and stores it on state.datingProspect for the player to accept or pass on. */
export function browseDatingApp(state: GameState): RelationshipActionResult {
  if (state.player.age < DATING_MIN_AGE) {
    return { state, feedText: "You're not old enough to use a dating app yet." };
  }
  if (state.partner && state.partner.alive) {
    return { state, feedText: 'You are already in a relationship.' };
  }

  const rng = new Rng(state.rngState);
  // Roughly matches the player's own gender preference in a simple hetero/homo mix — keep it simple and varied.
  const gender: Gender = rng.chance(0.85) ? otherGender(state.player.gender) : state.player.gender;
  const age = Math.max(DATING_MIN_AGE, state.player.age + rng.int(-4, 4));

  const prospect: FamilyMember = {
    id: makeId(rng, 'date'),
    firstName: randomFirstName(gender, rng.float()),
    lastName: randomLastName(rng.float()),
    gender,
    age,
    alive: true,
    role: 'partner',
    stats: randomStats(rng),
    relationship: rng.int(30, 65),
  };

  return {
    state: { ...state, rngState: rng.state, datingProspect: prospect },
    feedText: `You matched with ${prospect.firstName} on a dating app.`,
  };
}

export function startDating(state: GameState): RelationshipActionResult {
  if (!state.datingProspect) return { state, feedText: 'There is no one to start dating.' };
  const partner = state.datingProspect;
  return {
    state: {
      ...state,
      partner,
      datingProspect: undefined,
      flags: { ...state.flags, dating: true, married: false },
    },
    feedText: `You started dating ${partner.firstName}!`,
  };
}

export function passOnProspect(state: GameState): RelationshipActionResult {
  if (!state.datingProspect) return { state, feedText: 'There is no one to pass on.' };
  return {
    state: { ...state, datingProspect: undefined },
    feedText: `You decided not to pursue anything with ${state.datingProspect.firstName}.`,
  };
}

export function breakUp(state: GameState): RelationshipActionResult {
  if (!state.partner) return { state, feedText: 'You have no partner to break up with.' };
  const name = state.partner.firstName;
  return {
    state: {
      ...state,
      partner: undefined,
      flags: { ...state.flags, dating: false, married: false },
      player: { ...state.player, stats: { ...state.player.stats, happiness: Math.max(0, state.player.stats.happiness - 10) } },
    },
    feedText: `You broke up with ${name}.`,
  };
}

export function proposeMarriage(state: GameState): RelationshipActionResult {
  if (!state.partner || !state.partner.alive) return { state, feedText: 'You have no partner to propose to.' };
  if (state.flags.married) return { state, feedText: 'You are already married.' };
  if (state.player.age < MARRIAGE_MIN_AGE) return { state, feedText: "You're not old enough to get married yet." };

  const rng = new Rng(state.rngState);
  const chance = Math.max(0.1, Math.min(0.95, state.partner.relationship / 100));

  if (rng.chance(chance)) {
    return {
      state: {
        ...state,
        rngState: rng.state,
        flags: { ...state.flags, married: true, dating: true },
        partner: { ...state.partner, relationship: Math.min(100, state.partner.relationship + 10) },
        player: { ...state.player, stats: { ...state.player.stats, happiness: Math.min(100, state.player.stats.happiness + 15) } },
      },
      feedText: `${state.partner.firstName} said yes! You got married!`,
    };
  }

  return {
    state: {
      ...state,
      rngState: rng.state,
      partner: { ...state.partner, relationship: Math.max(0, state.partner.relationship - 15) },
    },
    feedText: `You proposed, but ${state.partner.firstName} wasn't ready. They said no.`,
  };
}

export function divorce(state: GameState): RelationshipActionResult {
  if (!state.partner || !state.flags.married) return { state, feedText: 'You are not married.' };
  const name = state.partner.firstName;
  const settlement = Math.round(state.player.money * 0.2);
  return {
    state: {
      ...state,
      partner: undefined,
      flags: { ...state.flags, married: false, dating: false },
      player: {
        ...state.player,
        money: state.player.money - settlement,
        stats: { ...state.player.stats, happiness: Math.max(0, state.player.stats.happiness - 20) },
      },
    },
    feedText: `You divorced ${name}, losing $${settlement.toLocaleString()} in the settlement.`,
  };
}

export function cheatOnPartner(state: GameState): RelationshipActionResult {
  if (!state.partner) return { state, feedText: 'You have no partner to cheat on.' };

  const rng = new Rng(state.rngState);
  const caught = rng.chance(0.5);
  const partnerName = state.partner.firstName;

  if (caught) {
    return {
      state: {
        ...state,
        rngState: rng.state,
        partner: undefined,
        flags: { ...state.flags, married: false, dating: false },
        player: {
          ...state.player,
          hidden: { karma: Math.max(-100, state.player.hidden.karma - 15) },
          stats: { ...state.player.stats, happiness: Math.max(0, state.player.stats.happiness - 15) },
        },
      },
      feedText: `${partnerName} caught you cheating and left you.`,
    };
  }

  return {
    state: {
      ...state,
      rngState: rng.state,
      partner: { ...state.partner, relationship: Math.max(0, state.partner.relationship - 10) },
      player: { ...state.player, hidden: { karma: Math.max(-100, state.player.hidden.karma - 8) } },
    },
    feedText: `You cheated on ${partnerName} and got away with it, for now.`,
  };
}

export function haveChild(state: GameState): RelationshipActionResult {
  if (!state.partner || !state.partner.alive) {
    return { state, feedText: 'You need a partner to have a child with.' };
  }

  const rng = new Rng(state.rngState);
  const gender: Gender = rng.chance(0.5) ? 'male' : 'female';
  const child: FamilyMember = {
    id: makeId(rng, 'child'),
    firstName: randomFirstName(gender, rng.float()),
    lastName: state.player.lastName,
    gender,
    age: 0,
    alive: true,
    role: 'child',
    stats: randomStats(rng),
    relationship: rng.int(70, 95),
  };

  return {
    state: {
      ...state,
      rngState: rng.state,
      children: [...state.children, child],
      player: { ...state.player, stats: { ...state.player.stats, happiness: Math.min(100, state.player.stats.happiness + 10) } },
    },
    feedText: `You had a baby! Welcome to the world, ${child.firstName}.`,
  };
}

/** All family + partner + children as one list, for actions that operate on "a person in your life" by id. */
export function getAllPeople(state: GameState): FamilyMember[] {
  return [...state.family, ...(state.partner ? [state.partner] : []), ...state.children];
}

/** Writes an updated FamilyMember[] (from getAllPeople) back into the family/partner/children buckets they came from. */
export function applyPeopleUpdate(state: GameState, updated: FamilyMember[]): GameState {
  const byId = new Map(updated.map((m) => [m.id, m]));
  const family = state.family.map((m) => byId.get(m.id) ?? m);
  const partner = state.partner ? byId.get(state.partner.id) ?? state.partner : undefined;
  const children = state.children.map((m) => byId.get(m.id) ?? m);
  return { ...state, family, partner, children };
}
