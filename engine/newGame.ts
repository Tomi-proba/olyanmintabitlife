import type { GameState } from './types';
import { Rng, createSeed } from './rng';
import { createCharacter, type CharacterCreateOptions } from './character';
import { makeId } from './id';
import { generateFamily } from './family';

export function newGame(options: CharacterCreateOptions = {}, seed: number = createSeed()): GameState {
  const rng = new Rng(seed);
  const player = createCharacter(rng, options);
  const family = generateFamily(rng, player);
  const birthFeedId = makeId(rng, 'feed');

  return {
    seed,
    rngState: rng.state,
    yearsLived: 0,
    player,
    family,
    children: [],
    education: { stage: 'none', grade: 0, gpa: 3.0 },
    assets: [],
    achievements: [],
    feed: [
      {
        id: birthFeedId,
        age: 0,
        year: 0,
        text: `${player.firstName} ${player.lastName} was born in ${player.city}, ${player.country}.`,
        kind: 'system',
      },
    ],
    flags: {},
    isAlive: true,
  };
}
