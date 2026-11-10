/**
 * Compact Top Trumps peek for catalogue media cards.
 * Labels match Play category names (Power, 0–60, Top speed).
 */

export type TrumpStatsCar = {
  bhp?: number | string | null;
  topSpeedMph?: number | string | null;
  zeroToSixtySecs?: number | string | null;
};

export type TrumpStatPeek = {
  id: "bhp" | "zero_to_sixty_secs" | "top_speed_mph";
  label: string;
  value: string;
};

function finiteStat(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  // Coerce MySQL DECIMAL strings (e.g. garage "8.50") the same as Number() mapping.
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function trumpStatsPeek(car: TrumpStatsCar): TrumpStatPeek[] {
  const stats: TrumpStatPeek[] = [];
  const bhp = finiteStat(car.bhp);
  if (bhp != null) {
    stats.push({ id: "bhp", label: "Power", value: String(bhp) });
  }
  const zero = finiteStat(car.zeroToSixtySecs);
  if (zero != null) {
    stats.push({
      id: "zero_to_sixty_secs",
      label: "0–60",
      value: `${zero}s`,
    });
  }
  const top = finiteStat(car.topSpeedMph);
  if (top != null) {
    stats.push({
      id: "top_speed_mph",
      label: "Top speed",
      value: `${top} mph`,
    });
  }
  return stats;
}
