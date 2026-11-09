import { formatCoins, formatMileage, listingTitle, type ListingDetail } from "./cars";

export type CompareHighlight = "left" | "right" | "tie" | "none";

export type CompareRow = {
  id: string;
  label: string;
  left: string;
  right: string;
  highlight: CompareHighlight;
};

function numericWinner(
  left: number,
  right: number,
  prefer: "higher" | "lower",
): CompareHighlight {
  if (left === right) return "tie";
  if (prefer === "higher") return left > right ? "left" : "right";
  return left < right ? "left" : "right";
}

export function buildCompareRows(left: ListingDetail, right: ListingDetail): CompareRow[] {
  return [
    {
      id: "price",
      label: "Brad Coin price",
      left: formatCoins(left.coinPrice),
      right: formatCoins(right.coinPrice),
      highlight: numericWinner(left.coinPrice, right.coinPrice, "lower"),
    },
    {
      id: "year",
      label: "Year",
      left: String(left.year),
      right: String(right.year),
      highlight: numericWinner(left.year, right.year, "higher"),
    },
    {
      id: "mileage",
      label: "Mileage",
      left: formatMileage(left.mileage),
      right: formatMileage(right.mileage),
      highlight: numericWinner(left.mileage, right.mileage, "lower"),
    },
    {
      id: "bhp",
      label: "BHP",
      left: `${left.bhp} bhp`,
      right: `${right.bhp} bhp`,
      highlight: numericWinner(left.bhp, right.bhp, "higher"),
    },
    {
      id: "top-speed",
      label: "Top speed",
      left: `${left.topSpeedMph} mph`,
      right: `${right.topSpeedMph} mph`,
      highlight: numericWinner(left.topSpeedMph, right.topSpeedMph, "higher"),
    },
    {
      id: "zero-sixty",
      label: "0–60",
      left: `${left.zeroToSixtySecs}s`,
      right: `${right.zeroToSixtySecs}s`,
      highlight: numericWinner(left.zeroToSixtySecs, right.zeroToSixtySecs, "lower"),
    },
    {
      id: "condition",
      label: "Condition",
      left: left.conditionType,
      right: right.conditionType,
      highlight: "none",
    },
    {
      id: "body",
      label: "Body / fuel",
      left: `${left.bodyType} · ${left.fuel}`,
      right: `${right.bodyType} · ${right.fuel}`,
      highlight: "none",
    },
    {
      id: "drivetrain",
      label: "Drivetrain",
      left: left.drivetrain,
      right: right.drivetrain,
      highlight: "none",
    },
    {
      id: "colour",
      label: "Colour",
      left: left.colour,
      right: right.colour,
      highlight: "none",
    },
    {
      id: "garage",
      label: "Garage",
      left: `${left.garageName}, ${left.garageCity}`,
      right: `${right.garageName}, ${right.garageCity}`,
      highlight: "none",
    },
  ];
}

export function compareTitles(left: ListingDetail, right: ListingDetail): {
  left: string;
  right: string;
} {
  return { left: listingTitle(left), right: listingTitle(right) };
}
