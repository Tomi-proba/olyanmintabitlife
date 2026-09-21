import type { Asset } from '../engine/types';

export interface ShopItemDefinition {
  id: string;
  type: Asset['type'];
  name: string;
  price: number;
  upkeepPerYear: number;
}

/** A small curated shop of purchasable assets. Add entries here to expand it — no engine changes needed. */
export const SHOP_ITEMS: ShopItemDefinition[] = [
  { id: 'car_used_sedan', type: 'car', name: 'Used Sedan', price: 8000, upkeepPerYear: 800 },
  { id: 'car_new_suv', type: 'car', name: 'New SUV', price: 35000, upkeepPerYear: 2200 },
  { id: 'car_sports', type: 'car', name: 'Sports Car', price: 65000, upkeepPerYear: 4500 },
  { id: 'property_studio', type: 'property', name: 'Studio Apartment', price: 80000, upkeepPerYear: 1800 },
  { id: 'property_house', type: 'property', name: 'Family House', price: 220000, upkeepPerYear: 3200 },
  { id: 'property_mansion', type: 'property', name: 'Luxury Mansion', price: 900000, upkeepPerYear: 12000 },
  { id: 'stock_index', type: 'stock', name: 'Index Fund Shares', price: 1000, upkeepPerYear: 0 },
  { id: 'stock_tech', type: 'stock', name: 'Tech Company Stock', price: 2500, upkeepPerYear: 0 },
  { id: 'crypto_coin', type: 'crypto', name: 'Coin Bundle', price: 500, upkeepPerYear: 0 },
  { id: 'crypto_token', type: 'crypto', name: 'Token Stack', price: 1500, upkeepPerYear: 0 },
];
