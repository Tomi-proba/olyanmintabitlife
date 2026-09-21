import { Rng } from '../engine/rng';
import { newGame } from '../engine/newGame';
import { buyAsset, sellAsset, applyYearlyAssetReturns } from '../engine/assets';
import type { GameState } from '../engine/types';

describe('buyAsset / sellAsset', () => {
  it('deducts the price from money and adds the asset', () => {
    const rng = new Rng(1);
    const state = newGame({ firstName: 'Buyer' }, 1);
    const withMoney = { ...state, player: { ...state.player, money: 20000 } };
    const result = buyAsset(withMoney, rng, 'car', 'Used Sedan', 8000, 800);
    expect(result.state.player.money).toBe(12000);
    expect(result.state.assets).toHaveLength(1);
    expect(result.state.assets[0].name).toBe('Used Sedan');
  });

  it('selling refunds current value and removes the asset', () => {
    const rng = new Rng(2);
    const state = newGame({ firstName: 'Seller' }, 2);
    const withMoney = { ...state, player: { ...state.player, money: 20000 } };
    const bought = buyAsset(withMoney, rng, 'property', 'Small House', 15000, 500);
    const sold = sellAsset(bought.state, bought.state.assets[0].id);
    expect(sold.state.assets).toHaveLength(0);
    expect(sold.state.player.money).toBe(bought.state.player.money + 15000);
  });

  it('selling an unknown asset id is a harmless no-op', () => {
    const state = newGame({ firstName: 'NoOp' }, 3);
    const result = sellAsset(state, 'does-not-exist');
    expect(result.state).toBe(state);
  });
});

describe('applyYearlyAssetReturns', () => {
  it('never produces a negative asset value', () => {
    const rng = new Rng(10);
    const state = newGame({ firstName: 'Investor' }, 10);
    let withAssets: GameState = {
      ...state,
      assets: [
        { id: 'a', type: 'stock' as const, name: 'Stock', value: 1000, upkeepPerYear: 0, costBasis: 1000 },
        { id: 'b', type: 'crypto' as const, name: 'Coin', value: 1000, upkeepPerYear: 0, costBasis: 1000 },
      ],
    };
    for (let i = 0; i < 20; i++) {
      withAssets = applyYearlyAssetReturns(withAssets, rng);
      for (const asset of withAssets.assets) {
        expect(asset.value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('is a no-op when there are no assets', () => {
    const state = newGame({ firstName: 'Empty' }, 11);
    const rng = new Rng(11);
    expect(applyYearlyAssetReturns(state, rng)).toBe(state);
  });
});
