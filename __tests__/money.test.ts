import { Rng } from '../engine/rng';
import { newGame } from '../engine/newGame';
import { applyYearlyFinances } from '../engine/money';
import { JOBS } from '../data/jobs';

describe('applyYearlyFinances', () => {
  it('adds net salary (after tax) for a full-time job', () => {
    const rng = new Rng(1);
    const state = newGame({ firstName: 'Earner' }, 1);
    const def = JOBS.find((j) => !j.partTime)!;
    const withJob = {
      ...state,
      player: { ...state.player, age: 25, money: 0 },
      job: { jobId: def.id, title: def.titles[0], field: def.field, tier: def.tier, level: 1 as const, salary: def.baseSalary, yearsWorked: 1, performance: 50, partTime: false },
    };
    const result = applyYearlyFinances(withJob, rng);
    // Net should be positive but less than gross salary once tax is subtracted.
    expect(result.state.player.money).toBeGreaterThan(0);
    expect(result.state.player.money).toBeLessThan(def.baseSalary);
  });

  it('charges no income tax for part-time teen jobs', () => {
    const rng = new Rng(2);
    const state = newGame({ firstName: 'Teen' }, 2);
    const def = JOBS.find((j) => j.partTime)!;
    const withJob = {
      ...state,
      player: { ...state.player, age: 15, money: 0 },
      job: { jobId: def.id, title: def.titles[0], field: def.field, tier: def.tier, level: 1 as const, salary: def.baseSalary, yearsWorked: 1, performance: 50, partTime: true },
    };
    const result = applyYearlyFinances(withJob, rng);
    expect(result.state.player.money).toBe(def.baseSalary);
  });

  it('applies asset upkeep against the balance', () => {
    const rng = new Rng(3);
    const state = newGame({ firstName: 'Owner' }, 3);
    const withAsset = {
      ...state,
      player: { ...state.player, age: 30, money: 10000 },
      assets: [{ id: 'a1', type: 'car' as const, name: 'Sedan', value: 15000, upkeepPerYear: 1200, costBasis: 15000 }],
    };
    const result = applyYearlyFinances(withAsset, rng);
    // No job, so money should be starting balance minus upkeep minus cost of living (adult).
    expect(result.state.player.money).toBeLessThan(10000 - 1200);
  });

  it('does not charge cost of living to minors', () => {
    const rng = new Rng(4);
    const state = newGame({ firstName: 'Minor' }, 4);
    const child = { ...state, player: { ...state.player, age: 10, money: 100 } };
    const result = applyYearlyFinances(child, rng);
    expect(result.state.player.money).toBe(100);
  });
});
