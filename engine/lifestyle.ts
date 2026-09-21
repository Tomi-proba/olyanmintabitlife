import type { GameState } from './types';
import { Rng } from './rng';

export interface LifestyleActionResult {
  state: GameState;
  feedText: string;
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function flagNumber(state: GameState, key: string): number {
  const value = state.flags[key];
  return typeof value === 'number' ? value : 0;
}

const VACATION_COST = 500;
const SHOPPING_COST = 150;

export function goOnVacation(state: GameState): LifestyleActionResult {
  if (state.player.money < VACATION_COST) {
    return { state, feedText: "You can't afford a vacation right now." };
  }
  const rng = new Rng(state.rngState);
  const happiness = clampStat(state.player.stats.happiness + rng.int(10, 20));
  const health = clampStat(state.player.stats.health + rng.int(2, 6));
  const flags = { ...state.flags, vacationsTaken: flagNumber(state, 'vacationsTaken') + 1 };
  return {
    state: {
      ...state,
      rngState: rng.state,
      flags,
      player: { ...state.player, money: state.player.money - VACATION_COST, stats: { ...state.player.stats, happiness, health } },
    },
    feedText: 'You went on a relaxing vacation.',
  };
}

export function volunteer(state: GameState): LifestyleActionResult {
  const rng = new Rng(state.rngState);
  const happiness = clampStat(state.player.stats.happiness + rng.int(3, 8));
  const karma = Math.min(100, state.player.hidden.karma + rng.int(5, 12));
  return {
    state: {
      ...state,
      rngState: rng.state,
      player: { ...state.player, stats: { ...state.player.stats, happiness }, hidden: { karma } },
    },
    feedText: 'You volunteered in your community and it felt great to give back.',
  };
}

export function goShopping(state: GameState): LifestyleActionResult {
  if (state.player.money < SHOPPING_COST) {
    return { state, feedText: "You can't afford to go shopping right now." };
  }
  const rng = new Rng(state.rngState);
  const looks = clampStat(state.player.stats.looks + rng.int(2, 6));
  const happiness = clampStat(state.player.stats.happiness + rng.int(3, 7));
  return {
    state: {
      ...state,
      rngState: rng.state,
      player: { ...state.player, money: state.player.money - SHOPPING_COST, stats: { ...state.player.stats, looks, happiness } },
    },
    feedText: 'You went shopping for some new things.',
  };
}
