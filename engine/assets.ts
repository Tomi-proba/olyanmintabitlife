import type { Asset, GameState } from './types';
import type { Rng } from './rng';
import { makeId } from './id';

export interface AssetActionResult {
  state: GameState;
  feedText: string;
}

export function buyAsset(
  state: GameState,
  rng: Rng,
  type: Asset['type'],
  name: string,
  value: number,
  upkeepPerYear = 0,
): AssetActionResult {
  const asset: Asset = { id: makeId(rng, 'asset'), type, name, value, upkeepPerYear, costBasis: value };
  return {
    state: {
      ...state,
      rngState: rng.state,
      player: { ...state.player, money: state.player.money - value },
      assets: [...state.assets, asset],
    },
    feedText: `You bought ${name} for $${value.toLocaleString()}.`,
  };
}

export function sellAsset(state: GameState, assetId: string): AssetActionResult {
  const asset = state.assets.find((a) => a.id === assetId);
  if (!asset) return { state, feedText: 'You no longer own that.' };

  const gain = asset.value - asset.costBasis;
  const gainText = gain >= 0 ? `a $${gain.toLocaleString()} gain` : `a $${Math.abs(gain).toLocaleString()} loss`;

  return {
    state: {
      ...state,
      player: { ...state.player, money: state.player.money + asset.value },
      assets: state.assets.filter((a) => a.id !== assetId),
    },
    feedText: `You sold ${asset.name} for $${asset.value.toLocaleString()} (${gainText}).`,
  };
}

function yearlyReturnRate(rng: Rng, type: Asset['type']): number {
  switch (type) {
    case 'stock':
      return rng.float() * 0.35 - 0.15; // -15% .. +20%
    case 'crypto':
      return rng.float() * 1.7 - 0.5; // -50% .. +120%
    case 'property':
      return rng.float() * 0.06; // 0% .. +6%
    case 'car':
      return -(rng.float() * 0.1 + 0.05); // -5% .. -15%
    default:
      return 0;
  }
}

/** Applies each asset's yearly value change (market swings for stock/crypto, appreciation/depreciation for property/car). */
export function applyYearlyAssetReturns(state: GameState, rng: Rng): GameState {
  if (state.assets.length === 0) return state;
  const assets = state.assets.map((asset) => {
    const rate = yearlyReturnRate(rng, asset.type);
    const value = Math.max(0, Math.round(asset.value * (1 + rate)));
    return { ...asset, value };
  });
  return { ...state, assets };
}
