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

function flagNumber(state: GameState, key: string): number {
  const value = state.flags[key];
  return typeof value === 'number' ? value : 0;
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
      flags: { ...stateAfterFiring.flags, wasIncarcerated: true },
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
    const biggestGambleWin = Math.max(flagNumber(state, 'biggestGambleWin'), amount);
    return {
      state: {
        ...state,
        rngState: rng.state,
        flags: { ...state.flags, biggestGambleWin },
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

const ESCAPE_BASE_CHANCE = 0.15;

/** A risky once-a-year gambit while imprisoned: succeed and you're free (and get an achievement); fail and your sentence grows. */
export function attemptPrisonEscape(state: GameState): CrimeActionResult {
  if (!state.prisonYearsLeft || state.prisonYearsLeft <= 0) {
    return { state, feedText: "You're not in prison." };
  }

  const rng = new Rng(state.rngState);
  const smartsEdge = (state.player.stats.smarts - 50) / 500;
  const chance = Math.max(0.05, Math.min(0.4, ESCAPE_BASE_CHANCE + smartsEdge));

  if (rng.chance(chance)) {
    return {
      state: {
        ...state,
        rngState: rng.state,
        prisonYearsLeft: undefined,
        flags: { ...state.flags, prisonEscape: true },
      },
      feedText: 'You made a daring escape from prison!',
    };
  }

  const extraYears = rng.int(1, 3);
  return {
    state: {
      ...state,
      rngState: rng.state,
      prisonYearsLeft: state.prisonYearsLeft + extraYears,
      player: { ...state.player, stats: { ...state.player.stats, happiness: Math.max(0, state.player.stats.happiness - 10) } },
    },
    feedText: `Your escape attempt failed. ${extraYears} more year${extraYears === 1 ? '' : 's'} added to your sentence.`,
  };
}
