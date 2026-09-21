import type { Rng } from './rng';

/**
 * Yearly death probability, driven by age and health. Both curves are
 * intentionally gentle in childhood/adulthood and steepen with old age or
 * very poor health, so most lives run for decades before ending.
 */
export function deathProbability(age: number, health: number): number {
  let ageFactor = 0;
  if (age > 60) {
    ageFactor = Math.pow((age - 60) / 40, 2) * 0.35;
  } else if (age > 40) {
    ageFactor = ((age - 40) / 20) * 0.01;
  }

  let healthFactor = 0;
  if (health < 20) {
    healthFactor = ((20 - health) / 20) * 0.25;
  }

  // A tiny flat baseline so accidents/illness can strike at any age.
  const baseline = 0.0008;

  return Math.min(0.98, baseline + ageFactor + healthFactor);
}

const OLD_AGE_CAUSES = ['Old age', 'Heart failure', 'Natural causes'];
const LOW_HEALTH_CAUSES = ['Illness', 'Organ failure', 'Complications from poor health'];
const RANDOM_CAUSES = ['A car accident', 'A freak accident', 'A sudden heart attack'];

export interface DeathRoll {
  died: boolean;
  cause?: string;
}

export function rollDeath(rng: Rng, age: number, health: number): DeathRoll {
  const probability = deathProbability(age, health);
  if (!rng.chance(probability)) {
    return { died: false };
  }

  if (age >= 70) {
    return { died: true, cause: rng.pick(OLD_AGE_CAUSES) };
  }
  if (health < 20) {
    return { died: true, cause: rng.pick(LOW_HEALTH_CAUSES) };
  }
  return { died: true, cause: rng.pick(RANDOM_CAUSES) };
}
