import { newGame } from '../engine/newGame';
import { visitDoctor, goToGym, followDietPlan, meditate } from '../engine/health';

function withMoney(seed: number, money: number) {
  const state = newGame({ firstName: 'Pat' }, seed);
  return { ...state, player: { ...state.player, money } };
}

describe('visitDoctor', () => {
  it('refuses when the player cannot afford it', () => {
    const state = withMoney(1, 10);
    const result = visitDoctor(state);
    expect(result.state).toBe(state);
    expect(result.feedText).toContain("can't afford");
  });

  it('charges the visit and improves health', () => {
    const state = withMoney(2, 1000);
    const result = visitDoctor(state);
    expect(result.state.player.money).toBeLessThan(1000);
    expect(result.state.player.stats.health).toBeGreaterThanOrEqual(state.player.stats.health);
  });
});

describe('goToGym / followDietPlan / meditate', () => {
  it('are all free and keep stats within bounds', () => {
    let state = newGame({ firstName: 'Fit' }, 3);
    state = goToGym(state).state;
    state = followDietPlan(state).state;
    state = meditate(state).state;
    for (const v of Object.values(state.player.stats)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
