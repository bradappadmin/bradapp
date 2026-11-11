/** Sum of listing Brad Coin prices for saved favourites. */

export function sumFavouritesValue(cars: Array<{ coinPrice: number }>): number {
  return cars.reduce((sum, car) => sum + Number(car.coinPrice), 0);
}

export type FavouritesBayValueStats = {
  /** Favourited listings currently saved. */
  favouriteCount: number;
  /** Sum of listing coin prices for those favourites. */
  totalValue: number;
};

/**
 * Bay strip stats for the full favourites list (not search-filtered).
 */
export function favouritesBayValueStats(
  cars: Array<{ coinPrice: number }>,
): FavouritesBayValueStats {
  return {
    favouriteCount: cars.length,
    totalValue: sumFavouritesValue(cars),
  };
}

export function favouritesBayCountLabel(count: number): string {
  if (count === 1) return "1 favourite saved";
  return `${count} favourites saved`;
}

export function favouritesBayValueLabel(
  totalValue: number,
  formatCoins: (n: number) => string,
): string {
  return `Favourites value ${formatCoins(totalValue)}`;
}
