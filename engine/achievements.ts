import type { GameState } from './types';
import { ACHIEVEMENTS, type AchievementDefinition } from '../data/achievements';

export interface AchievementEvaluation {
  state: GameState;
  newlyUnlocked: AchievementDefinition[];
}

/** Checks every not-yet-unlocked achievement against the current state; called once per year from ageUp. */
export function evaluateAchievements(state: GameState): AchievementEvaluation {
  const newlyUnlocked = ACHIEVEMENTS.filter((a) => !state.achievements.includes(a.id) && a.check(state));
  if (newlyUnlocked.length === 0) {
    return { state, newlyUnlocked };
  }
  return {
    state: { ...state, achievements: [...state.achievements, ...newlyUnlocked.map((a) => a.id)] },
    newlyUnlocked,
  };
}
