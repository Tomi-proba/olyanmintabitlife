import type { GameState } from './types';
import { Rng } from './rng';

export interface CrimeActionResult {
  state: GameState;
  feedText: string;
}

interface CrimeConfig {
  label: string;
  minGain: number;
  maxGain: number;
  /** Base chance of getting caught; effectively reduced by high Smarts. */
  catchChance: number;
  karmaHit: number;
  fineRange: [number, number];
  prisonYearsRange: [number, number];
  /** Chance the consequence is a fine rather than prison, when caught. */
  fineChance: number;
}

function catchChanceFor(state: GameState, base: number): number {
  const smartsEdge = (state.player.stats.smarts - 50) / 300;
  return Math.max(0.05, Math.min(0.9, base - smartsEdge));
}

function applyArrestConsequences(state: GameState, rng: Rng, config: CrimeConfig): { state: GameState; feedText: string } {
  const stateAfterFiring = state.job ? { ...state, job: undefined } : state;

  if (rng.chance(config.fineChance)) {
    const fine = rng.int(config.fineRange[0], config.fineRange[1]);
    return {
      state: {
        ...stateAfterFiring,
        player: { ...stateAfterFiring.player, money: stateAfterFiring.player.money - fine },
      },
      feedText: `You were caught committing a crime and fined $${fine.toLocaleString()}.`,
    };
  }

  const years = rng.int(config.prisonYearsRange[0], config.prisonYearsRange[1]);
  return {
    state: {
      ...stateAfterFiring,
      prisonYearsLeft: (stateAfterFiring.prisonYearsLeft ?? 0) + years,
      player: {
        ...stateAfterFiring.player,
        stats: { ...stateAfterFiring.player.stats, happiness: Math.max(0, stateAfterFiring.player.stats.happiness - 15) },
      },
    },
    feedText: `You were arrested and sentenced to ${years} year${years === 1 ? '' : 's'} in prison.`,
  };
}

function attemptCrime(state: GameState, config: CrimeConfig): CrimeActionResult {
  if (state.prisonYearsLeft && state.prisonYearsLeft > 0) {
    return { state, feedText: "You can't do that from prison." };
  }

  const rng = new Rng(state.rngState);
  const caught = rng.chance(catchChanceFor(state, config.catchChance));

  if (caught) {
    const result = applyArrestConsequences(state, rng, config);
    return { state: { ...result.state, rngState: rng.state }, feedText: result.feedText };
  }

  const gain = rng.int(config.minGain, config.maxGain);
  const karma = Math.max(-100, state.player.hidden.karma - config.karmaHit);
  return {
    state: {
      ...state,
      rngState: rng.state,
      player: { ...state.player, money: state.player.money + gain, hidden: { karma } },
    },
    feedText: `You got away with it and made $${gain.toLocaleString()}.`,
  };
}

export function pettyTheft(state: GameState): CrimeActionResult {
  return attemptCrime(state, {
    label: 'Petty Theft',
    minGain: 20,
    maxGain: 150,
    catchChance: 0.3,
    karmaHit: 3,
    fineRange: [50, 250],
    prisonYearsRange: [1, 2],
    fineChance: 0.7,
  });
}

export function robbery(state: GameState): CrimeActionResult {
  return attemptCrime(state, {
    label: 'Robbery',
    minGain: 300,
    maxGain: 2500,
    catchChance: 0.45,
    karmaHit: 10,
    fineRange: [200, 800],
    prisonYearsRange: [2, 6],
    fineChance: 0.3,
  });
}

export function dealDrugs(state: GameState): CrimeActionResult {
  const result = attemptCrime(state, {
    label: 'Deal Drugs',
    minGain: 300,
    maxGain: 3000,
    catchChance: 0.35,
    karmaHit: 8,
    fineRange: [200, 1000],
    prisonYearsRange: [2, 5],
    fineChance: 0.25,
  });

  const rng = new Rng(result.state.rngState);
  if (rng.chance(0.15)) {
    const healthLoss = rng.int(8, 20);
    return {
      state: {
        ...result.state,
        rngState: rng.state,
        player: {
          ...result.state.player,
          stats: { ...result.state.player.stats, health: Math.max(0, result.state.player.stats.health - healthLoss) },
        },
      },
      feedText: `${result.feedText} The product took a toll on your health.`,
    };
  }

  return { ...result, state: { ...result.state, rngState: rng.state } };
}

const GAMBLE_WIN_CHANCE = 0.45;

export function gamble(state: GameState, amount: number): CrimeActionResult {
  if (amount <= 0 || state.player.money < amount) {
    return { state, feedText: "You don't have enough money to place that bet." };
  }

  const rng = new Rng(state.rngState);
  if (rng.chance(GAMBLE_WIN_CHANCE)) {
    return {
      state: {
        ...state,
        rngState: rng.state,
        player: {
          ...state.player,
          money: state.player.money + amount,
          stats: { ...state.player.stats, happiness: Math.min(100, state.player.stats.happiness + 8) },
        },
      },
      feedText: `You won $${amount.toLocaleString()} at the casino!`,
    };
  }

  return {
    state: {
      ...state,
      rngState: rng.state,
      player: {
        ...state.player,
        money: state.player.money - amount,
        stats: { ...state.player.stats, happiness: Math.max(0, state.player.stats.happiness - 8) },
      },
    },
    feedText: `You lost $${amount.toLocaleString()} at the casino.`,
  };
}
