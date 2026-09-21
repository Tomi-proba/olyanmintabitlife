import type { GameState } from './types';
import { Rng } from './rng';

export interface HealthActionResult {
  state: GameState;
  feedText: string;
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function adjustStats(state: GameState, deltas: Partial<{ happiness: number; health: number; smarts: number; looks: number }>): GameState['player']['stats'] {
  return {
    happiness: clampStat(state.player.stats.happiness + (deltas.happiness ?? 0)),
    health: clampStat(state.player.stats.health + (deltas.health ?? 0)),
    smarts: clampStat(state.player.stats.smarts + (deltas.smarts ?? 0)),
    looks: clampStat(state.player.stats.looks + (deltas.looks ?? 0)),
  };
}

const DOCTOR_COST = 80;

export function visitDoctor(state: GameState): HealthActionResult {
  if (state.player.money < DOCTOR_COST) {
    return { state, feedText: "You can't afford a doctor's visit right now." };
  }

  const rng = new Rng(state.rngState);
  const healthGain = rng.int(5, 15);
  const stats = adjustStats(state, { health: healthGain, happiness: rng.int(0, 3) });
  let flags = state.flags;
  let feedText = 'You went to the doctor for a checkup and are feeling better.';

  if (!state.flags.chronicCondition && rng.chance(0.04)) {
    flags = { ...flags, chronicCondition: true };
    feedText = 'The doctor diagnosed you with a chronic condition that will need ongoing care.';
  }

  return {
    state: {
      ...state,
      rngState: rng.state,
      flags,
      player: { ...state.player, money: state.player.money - DOCTOR_COST, stats },
    },
    feedText,
  };
}

function flagNumber(state: GameState, key: string): number {
  const value = state.flags[key];
  return typeof value === 'number' ? value : 0;
}

export function goToGym(state: GameState): HealthActionResult {
  const rng = new Rng(state.rngState);
  const stats = adjustStats(state, { health: rng.int(3, 8), looks: rng.int(1, 4), happiness: rng.int(1, 4) });
  const flags = { ...state.flags, gymVisits: flagNumber(state, 'gymVisits') + 1 };
  return {
    state: { ...state, rngState: rng.state, flags, player: { ...state.player, stats } },
    feedText: 'You had a great workout at the gym.',
  };
}

export function followDietPlan(state: GameState): HealthActionResult {
  const rng = new Rng(state.rngState);
  const stats = adjustStats(state, { health: rng.int(2, 6), looks: rng.int(1, 3), happiness: -rng.int(0, 3) });
  return {
    state: { ...state, rngState: rng.state, player: { ...state.player, stats } },
    feedText: 'You stuck to a healthy diet plan this year.',
  };
}

export function meditate(state: GameState): HealthActionResult {
  const rng = new Rng(state.rngState);
  const stats = adjustStats(state, { happiness: rng.int(3, 8), health: rng.int(0, 2) });
  return {
    state: { ...state, rngState: rng.state, player: { ...state.player, stats } },
    feedText: 'You spent some time meditating and feel more centered.',
  };
}
