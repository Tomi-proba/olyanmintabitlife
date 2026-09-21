import { newGame } from '../engine/newGame';
import { goOnVacation, volunteer, goShopping } from '../engine/lifestyle';

function withMoney(seed: number, money: number) {
  const state = newGame({ firstName: 'Lux' }, seed);
  return { ...state, player: { ...state.player, money } };
}

describe('goOnVacation / goShopping', () => {
  it('refuse when the player cannot afford them', () => {
    const poor = withMoney(1, 0);
    expect(goOnVacation(poor).state).toBe(poor);
    expect(goShopping(poor).state).toBe(poor);
  });

  it('charge the cost and raise stats when affordable', () => {
    const rich = withMoney(2, 10000);
    const afterVacation = goOnVacation(rich);
    expect(afterVacation.state.player.money).toBeLessThan(10000);
    expect(afterVacation.state.player.stats.happiness).toBeGreaterThanOrEqual(rich.player.stats.happiness);
  });
});

describe('volunteer', () => {
  it('is free and raises karma', () => {
    const state = newGame({ firstName: 'Kind' }, 3);
    const result = volunteer(state);
    expect(result.state.player.money).toBe(state.player.money);
    expect(result.state.player.hidden.karma).toBeGreaterThan(state.player.hidden.karma);
  });
});
