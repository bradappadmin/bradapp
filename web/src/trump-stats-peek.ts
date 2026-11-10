/**
 * Compact Top Trumps peek for catalogue media cards.
 * Labels match Play category names (Power, 0–60, Top speed).
 */

export type TrumpStatsCar = {
  bhp?: number | null;
  topSpeedMph?: number | null;
  zeroToSixtySecs?: number | null;
};

export type TrumpStatPeek = {
  id: "bhp" | "zero_to_sixty_secs" | "top_speed_mph";
  label: string;
  value: string;
};

export function trumpStatsPeek(car: TrumpStatsCar): TrumpStatPeek[] {
  const stats: TrumpStatPeek[] = [];
  if (car.bhp != null && Number.isFinite(car.bhp)) {
    stats.push({ id: "bhp", label: "Power", value: String(car.bhp) });
  }
  if (car.zeroToSixtySecs != null && Number.isFinite(car.zeroToSixtySecs)) {
    stats.push({
      id: "zero_to_sixty_secs",
      label: "0–60",
      value: `${car.zeroToSixtySecs}s`,
    });
  }
  if (car.topSpeedMph != null && Number.isFinite(car.topSpeedMph)) {
    stats.push({
      id: "top_speed_mph",
      label: "Top speed",
      value: `${car.topSpeedMph} mph`,
    });
  }
  return stats;
}
