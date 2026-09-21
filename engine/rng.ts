/**
 * Seedable RNG (mulberry32) so a life can be reproduced from a seed in tests.
 * No UI or platform imports — pure TypeScript.
 */

export type RngState = number;

export function createSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

/** Advances the RNG state and returns a float in [0, 1). */
export function nextFloat(state: RngState): [number, RngState] {
  let t = (state + 0x6d2b79f5) >>> 0;
  const nextState = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, nextState];
}

/**
 * A convenience stateful wrapper around the pure mulberry32 stepper.
 * Mutates its own `state` field, but every underlying step is still a pure
 * function of the previous state, so a Rng created from the same seed and
 * driven with the same call sequence always reproduces the same run.
 */
export class Rng {
  state: RngState;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  float(): number {
    const [value, nextState] = nextFloat(this.state);
    this.state = nextState;
    return value;
  }

  /** Random integer in [min, max], inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.float() * (max - min + 1)) + min;
  }

  /** True with probability `p` (0..1). */
  chance(p: number): boolean {
    return this.float() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Rng.pick called with an empty array');
    }
    return items[this.int(0, items.length - 1)];
  }

  /** Weighted pick using a `weight` accessor; all weights must be > 0. */
  weightedPick<T>(items: readonly T[], weight: (item: T) => number): T {
    const total = items.reduce((sum, item) => sum + weight(item), 0);
    if (total <= 0) {
      return this.pick(items);
    }
    let roll = this.float() * total;
    for (const item of items) {
      roll -= weight(item);
      if (roll <= 0) return item;
    }
    return items[items.length - 1];
  }
}
