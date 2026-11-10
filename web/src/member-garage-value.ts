/** Sum of listing Brad Coin prices for a public member garage. */

export function sumMemberGarageValue(cars: Array<{ coinPrice: number }>): number {
  return cars.reduce((sum, car) => sum + Number(car.coinPrice), 0);
}

export type MemberGarageBayValueStats = {
  /** Cars currently in this public garage. */
  carCount: number;
  /** Sum of listing coin prices for those cars. */
  totalValue: number;
};

/**
 * Bay strip stats for the public garage list (owned + for sale on that bay).
 */
export function memberGarageBayValueStats(
  cars: Array<{ coinPrice: number }>,
): MemberGarageBayValueStats {
  return {
    carCount: cars.length,
    totalValue: sumMemberGarageValue(cars),
  };
}

export function memberGarageBayCountLabel(count: number): string {
  if (count === 1) return "1 car in this bay";
  return `${count} cars in this bay`;
}

export function memberGarageBayValueLabel(
  totalValue: number,
  formatCoins: (n: number) => string,
): string {
  return `Bay value ${formatCoins(totalValue)}`;
}
