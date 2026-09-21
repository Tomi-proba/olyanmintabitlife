import type { GameState } from './types';
import type { Rng } from './rng';
import { applyYearlyAssetReturns } from './assets';

function taxRateFor(salary: number): number {
  if (salary <= 0) return 0;
  if (salary < 20000) return 0.05;
  if (salary < 50000) return 0.15;
  if (salary < 100000) return 0.25;
  return 0.32;
}

/**
 * Yearly income, tax, asset upkeep, cost of living, debt interest, and
 * investment returns — everything that moves the bank balance on its own,
 * independent of player choices. Called once per year from ageUp.
 */
export function applyYearlyFinances(state: GameState, rng: Rng): { state: GameState; feedTexts: string[] } {
  const feedTexts: string[] = [];
  const job = state.job;
  const isAdult = state.player.age >= 18;

  const salary = job ? job.salary : 0;
  const tax = job && !job.partTime ? Math.round(salary * taxRateFor(salary)) : 0;
  const upkeep = state.assets.reduce((sum, asset) => sum + asset.upkeepPerYear, 0);
  const costOfLiving = isAdult && !state.flags.retired ? rng.int(2000, 5000) : 0;

  let money = state.player.money + salary - tax - upkeep - costOfLiving;

  if (money < 0) {
    const interest = Math.round(money * -0.08);
    money -= interest;
  }

  if (job && salary > 0) {
    feedTexts.push(`${state.player.firstName} earned $${salary.toLocaleString()} this year as a ${job.title}.`);
  }
  if (money < -500 && state.player.money >= -500) {
    feedTexts.push(`${state.player.firstName} fell into debt.`);
  }

  const withAssetReturns = applyYearlyAssetReturns({ ...state, player: { ...state.player, money } }, rng);

  return { state: withAssetReturns, feedTexts };
}
