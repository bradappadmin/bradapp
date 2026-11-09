import type { TopTrumpsCategory } from "./api";

export function topTrumpsCategoryLabel(category: TopTrumpsCategory): string {
  switch (category) {
    case "bhp":
      return "Power (BHP)";
    case "top_speed_mph":
      return "Top speed";
    case "zero_to_sixty_secs":
      return "0–60";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function matchResultLabel(result: "win" | "loss" | "draw"): string {
  switch (result) {
    case "win":
      return "Win";
    case "loss":
      return "Loss";
    case "draw":
      return "Draw";
    default: {
      const _exhaustive: never = result;
      return _exhaustive;
    }
  }
}

export function formatMatchCarTitle(car: {
  make: string;
  model: string;
  trimName: string;
}): string {
  return `${car.make} ${car.model}${car.trimName ? ` ${car.trimName}` : ""}`;
}
