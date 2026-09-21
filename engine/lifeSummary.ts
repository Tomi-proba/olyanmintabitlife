import type { GameState, LifeSummary } from './types';

export function buildLifeSummary(state: GameState): LifeSummary {
  return {
    firstName: state.player.firstName,
    lastName: state.player.lastName,
    ageAtDeath: state.player.age,
    netWorth: state.player.money,
    career: state.job?.title ?? 'Unemployed',
    kids: state.children.length,
    achievements: state.achievements,
    causeOfDeath: state.deathCause ?? 'Unknown',
  };
}
