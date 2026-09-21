import { newGame } from '../engine/newGame';
import { pettyTheft, robbery, dealDrugs, gamble } from '../engine/crime';
import type { GameState } from '../engine/types';

function baseState(seed: number) {
  const state = newGame({ firstName: 'Risky' }, seed);
  return { ...state, player: { ...state.player, age: 25, money: 5000 } };
}

describe('pettyTheft / robbery / dealDrugs', () => {
  it('either pays out or has consequences (fine or prison), and always advances rng', () => {
    for (const fn of [pettyTheft, robbery, dealDrugs]) {
      const state = baseState(1);
      const result = fn(state);
      expect(result.state.rngState).not.toBe(state.rngState);
      const gainedMoney = result.state.player.money > state.player.money;
      const lostMoney = result.state.player.money < state.player.money;
      const jailed = (result.state.prisonYearsLeft ?? 0) > (state.prisonYearsLeft ?? 0);
      expect(gainedMoney || lostMoney || jailed).toBe(true);
    }
  });

  it('refuses to commit crime while in prison', () => {
    const state = { ...baseState(2), prisonYearsLeft: 2 };
    const result = pettyTheft(state);
    expect(result.state).toBe(state);
    expect(result.feedText).toContain("can't do that from prison");
  });

  it('being sent to prison clears the current job', () => {
    const withJob = (seed: number): GameState => ({
      ...baseState(seed),
      job: { jobId: 'x', title: 'Worker', field: 'Test', tier: 1, level: 1, salary: 30000, yearsWorked: 1, performance: 50, partTime: false },
    });

    let foundPrisonCase = false;
    for (let seed = 1; seed < 200 && !foundPrisonCase; seed++) {
      const result = robbery(withJob(seed));
      if (result.state.prisonYearsLeft) {
        expect(result.state.job).toBeUndefined();
        foundPrisonCase = true;
      }
    }
    expect(foundPrisonCase).toBe(true);
  });
});

describe('gamble', () => {
  it('refuses an invalid or unaffordable bet', () => {
    const state = baseState(4);
    expect(gamble(state, 0).state).toBe(state);
    expect(gamble(state, 1_000_000).state).toBe(state);
  });

  it('either wins or loses exactly the bet amount', () => {
    const state = baseState(5);
    const result = gamble(state, 100);
    const diff = result.state.player.money - state.player.money;
    expect(Math.abs(diff)).toBe(100);
  });
});
