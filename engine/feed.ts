import type { FeedEntry, GameState } from './types';
import { Rng } from './rng';
import { makeId } from './id';

/** Appends a single feed entry for the current year, consuming one rng step for its id. */
export function appendFeedText(state: GameState, text: string, kind: FeedEntry['kind'] = 'narration'): GameState {
  const rng = new Rng(state.rngState);
  const entry: FeedEntry = { id: makeId(rng, 'feed'), age: state.player.age, year: state.yearsLived, text, kind };
  return { ...state, rngState: rng.state, feed: [...state.feed, entry] };
}
