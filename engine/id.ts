import type { Rng } from './rng';

/**
 * Deterministic id generator driven by the game's Rng so ids stay
 * reproducible from a seed (unlike crypto.randomUUID, which isn't
 * guaranteed available across RN/web/jsdom and isn't seedable anyway).
 */
export function makeId(rng: Rng, prefix = 'id'): string {
  const bytes = Array.from({ length: 8 }, () => rng.int(0, 15).toString(16));
  return `${prefix}_${bytes.join('')}`;
}
