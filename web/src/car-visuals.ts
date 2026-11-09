/** Original Midnight Garage paint + silhouette cues — no stock photos. */

const PAINT: Record<string, { fill: string; glow: string }> = {
  "Arctic White": { fill: "#e8eef7", glow: "rgba(232, 238, 247, 0.35)" },
  "British Racing Green": { fill: "#1f6b4f", glow: "rgba(31, 107, 79, 0.45)" },
  "Laser Blue": { fill: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)" },
  "Midnight Black": { fill: "#1a1f2a", glow: "rgba(163, 230, 53, 0.22)" },
  "Nardo Grey": { fill: "#6b727d", glow: "rgba(107, 114, 125, 0.4)" },
  "Racing Red": { fill: "#dc2626", glow: "rgba(220, 38, 38, 0.4)" },
  Silver: { fill: "#a8b0bc", glow: "rgba(168, 176, 188, 0.4)" },
  "Storm Grey": { fill: "#4a5564", glow: "rgba(74, 85, 100, 0.4)" },
  "Sunset Orange": { fill: "#ea7a2e", glow: "rgba(234, 122, 46, 0.4)" },
  "Volcano Yellow": { fill: "#eab308", glow: "rgba(234, 179, 8, 0.4)" },
};

const FALLBACK_PAINT = { fill: "#8b9bb8", glow: "rgba(139, 155, 184, 0.35)" };

/**
 * Side-profile silhouettes (viewBox 0 0 160 64) — original path art per body type.
 * Body fill + separate wheel ellipses drawn by the component.
 */
const SILHOUETTES: Record<string, string> = {
  Coupe:
    "M14 44 L22 44 C24 34 30 28 42 26 L70 24 C88 24 102 26 112 32 L128 40 L146 42 L146 48 L14 48 Z M48 26 L58 34 L92 34 L100 28",
  Estate:
    "M12 44 L20 44 C22 36 28 30 40 28 L62 26 L118 26 L130 34 L148 40 L148 48 L12 48 Z M62 26 L62 36 L118 36 L118 26",
  Hatchback:
    "M16 44 L24 44 C26 36 32 30 42 28 L68 26 C86 26 100 28 110 34 L126 42 L144 44 L144 48 L16 48 Z M52 27 L62 36 L100 36 L108 30",
  Saloon:
    "M12 44 L20 44 C22 36 28 30 40 28 L66 26 C82 26 96 28 106 34 L124 42 L148 44 L148 48 L12 48 Z M50 27 L60 36 L98 36 L106 30",
  SUV: "M14 44 L22 44 C24 38 28 32 38 30 L58 28 L120 28 L132 34 L148 40 L148 48 L14 48 Z M58 28 L58 38 L120 38 L120 28",
};

const DEFAULT_SILHOUETTE = SILHOUETTES.Saloon;

export function carPaint(colour: string): { fill: string; glow: string } {
  return PAINT[colour] ?? FALLBACK_PAINT;
}

export function carSilhouettePath(bodyType?: string | null): string {
  if (!bodyType) return DEFAULT_SILHOUETTE;
  return SILHOUETTES[bodyType] ?? DEFAULT_SILHOUETTE;
}

export type CarBadgeKind = "price" | "owned" | "for_sale" | "sold";

export function carBadgeLabel(kind: CarBadgeKind, priceLabel?: string): string {
  switch (kind) {
    case "price":
      return priceLabel ?? "For sale";
    case "owned":
      return "Owned";
    case "for_sale":
      return priceLabel ? `Listed · ${priceLabel}` : "Listed";
    case "sold":
      return "Sold";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function badgeForStatus(
  status: string | undefined,
  forSaleDefault: CarBadgeKind = "price",
): CarBadgeKind {
  switch (status) {
    case "owned":
      return "owned";
    case "available":
      return forSaleDefault;
    case "sold":
      return "sold";
    default:
      return forSaleDefault;
  }
}
