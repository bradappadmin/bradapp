/** Sum of list / fair Brad Coin prices for cars in My cars. */

export function sumGarageValue(cars: Array<{ coinPrice: number }>): number {
  return cars.reduce((sum, car) => sum + Number(car.coinPrice), 0);
}

export type GarageBayValueStats = {
  /** Cars currently held (owned + for sale). Sold history is excluded. */
  ownedCount: number;
  /** Sum of listing coin prices for those cars. */
  totalValue: number;
};

/**
 * Bay strip stats for currently held cars only.
 * Pass the live garage list (owned + available) — never sold-history rows.
 */
export function garageBayValueStats(
  cars: Array<{ coinPrice: number }>,
): GarageBayValueStats {
  return {
    ownedCount: cars.length,
    totalValue: sumGarageValue(cars),
  };
}

export function garageBayOwnedCountLabel(count: number): string {
  if (count === 1) return "1 car in your bay";
  return `${count} cars in your bay`;
}

export function garageBayValueLabel(totalValue: number, formatCoins: (n: number) => string): string {
  return `Bay value ${formatCoins(totalValue)}`;
}
