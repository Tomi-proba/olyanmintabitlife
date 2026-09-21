import type { GameState } from './types';
import { Rng } from './rng';
import { makeId } from './id';
import {
  argueWithFamily,
  askFamilyForMoney,
  giveGiftToFamily,
  spendTimeWithFamily,
  type FamilyActionResult,
} from './family';

export type FamilyActionType = 'spendTime' | 'gift' | 'argue' | 'askForMoney';

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function applyResult(state: GameState, rng: Rng, result: FamilyActionResult): GameState {
  const stats = { ...state.player.stats, happiness: clampStat(state.player.stats.happiness + result.happinessDelta) };
  const money = state.player.money + result.moneyDelta;
  const feedEntry = {
    id: makeId(rng, 'feed'),
    age: state.player.age,
    year: state.yearsLived,
    text: result.feedText,
    kind: 'narration' as const,
  };

  return {
    ...state,
    rngState: rng.state,
    player: { ...state.player, stats, money },
    family: result.family,
    feed: [...state.feed, feedEntry],
  };
}

/** A once-off action the player can take with a family member outside the yearly event roll. */
export function performFamilyAction(
  state: GameState,
  type: FamilyActionType,
  memberId: string,
  amount?: number,
): GameState {
  const rng = new Rng(state.rngState);

  switch (type) {
    case 'spendTime':
      return applyResult(state, rng, spendTimeWithFamily(rng, state.family, memberId, state.player.firstName));
    case 'gift':
      return applyResult(state, rng, giveGiftToFamily(rng, state.family, memberId, amount ?? 20));
    case 'argue':
      return applyResult(state, rng, argueWithFamily(rng, state.family, memberId));
    case 'askForMoney':
      return applyResult(state, rng, askFamilyForMoney(rng, state.family, memberId));
    default:
      return state;
  }
}
