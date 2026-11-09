/** Sum of list / fair Brad Coin prices for cars in My cars. */

export function sumGarageValue(cars: Array<{ coinPrice: number }>): number {
  return cars.reduce((sum, car) => sum + Number(car.coinPrice), 0);
}
