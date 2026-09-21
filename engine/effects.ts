import type { EffectSpec, GameState } from './types';

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Applies an EffectSpec (stats/money/karma/relationship-to-subject/flags) to a GameState. */
export function applyEffects(state: GameState, effects: EffectSpec | undefined, subjectId?: string): GameState {
  if (!effects) return state;

  const stats = { ...state.player.stats };
  if (effects.happiness !== undefined) stats.happiness = clampStat(stats.happiness + effects.happiness);
  if (effects.health !== undefined) stats.health = clampStat(stats.health + effects.health);
  if (effects.smarts !== undefined) stats.smarts = clampStat(stats.smarts + effects.smarts);
  if (effects.looks !== undefined) stats.looks = clampStat(stats.looks + effects.looks);

  const money = state.player.money + (effects.money ?? 0);
  const karma = Math.max(-100, Math.min(100, state.player.hidden.karma + (effects.karma ?? 0)));

  const family =
    effects.relationship !== undefined && subjectId
      ? state.family.map((m) =>
          m.id === subjectId
            ? { ...m, relationship: Math.max(0, Math.min(100, Math.round(m.relationship + (effects.relationship ?? 0)))) }
            : m,
        )
      : state.family;

  const flags = effects.flags ? { ...state.flags, ...effects.flags } : state.flags;

  return {
    ...state,
    player: { ...state.player, stats, money, hidden: { karma } },
    family,
    flags,
  };
}
