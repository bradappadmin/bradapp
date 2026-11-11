import { describe, expect, it } from "vitest";
import type { GarageCar } from "./api";
import { filterGarageCarsByQuery } from "./garage-car-filter";

function car(
  partial: Partial<GarageCar> & Pick<GarageCar, "id" | "make" | "model" | "status">,
): GarageCar {
  return {
    trimName: "",
    bodyType: "Coupe",
    bhp: 200,
    topSpeedMph: 140,
    zeroToSixtySecs: 6,
    conditionType: "used",
    year: 2020,
    colour: "Black",
    mileage: 10000,
    coinPrice: 100,
    ownerLabel: "You",
    garageName: "Bay",
    garageCity: "London",
    ...partial,
  };
}

const rows: GarageCar[] = [
  car({ id: 1, make: "Porsche", model: "911", trimName: "GT3", status: "owned" }),
  car({ id: 2, make: "Audi", model: "RS6", trimName: "Avant", status: "owned" }),
  car({ id: 3, make: "Ford", model: "Focus", trimName: "ST", status: "available" }),
];

describe("garage-car-filter", () => {
  it("filters by make, model, and trim", () => {
    expect(filterGarageCarsByQuery(rows, "").map((c) => c.id)).toEqual([1, 2, 3]);
    expect(filterGarageCarsByQuery(rows, "porsche").map((c) => c.id)).toEqual([1]);
    expect(filterGarageCarsByQuery(rows, "rs6").map((c) => c.id)).toEqual([2]);
    expect(filterGarageCarsByQuery(rows, "focus").map((c) => c.id)).toEqual([3]);
    expect(filterGarageCarsByQuery(rows, "gt3").map((c) => c.id)).toEqual([1]);
    expect(filterGarageCarsByQuery(rows, "zzzz")).toEqual([]);
  });
});
