/** Original Midnight Garage car art — layered side profiles, not stock photos. */

export type CarPaint = {
  base: string;
  highlight: string;
  shade: string;
  deep: string;
  glow: string;
  glass: string;
  glassEdge: string;
  light: string;
  rim: string;
};

const PAINT: Record<string, CarPaint> = {
  "Arctic White": {
    base: "#e8eef7",
    highlight: "#ffffff",
    shade: "#b8c4d6",
    deep: "#8a97ab",
    glow: "rgba(232, 238, 247, 0.28)",
    glass: "rgba(70, 95, 130, 0.55)",
    glassEdge: "rgba(180, 205, 235, 0.55)",
    light: "#fff6d6",
    rim: "#c5ceda",
  },
  "British Racing Green": {
    base: "#1f6b4f",
    highlight: "#3fa87a",
    shade: "#134836",
    deep: "#0a2a1f",
    glow: "rgba(31, 107, 79, 0.4)",
    glass: "rgba(20, 45, 40, 0.62)",
    glassEdge: "rgba(120, 180, 150, 0.35)",
    light: "#ffe9a8",
    rim: "#9aa7b5",
  },
  "Laser Blue": {
    base: "#2563eb",
    highlight: "#60a5fa",
    shade: "#1d4ed8",
    deep: "#12307a",
    glow: "rgba(37, 99, 235, 0.42)",
    glass: "rgba(25, 45, 90, 0.6)",
    glassEdge: "rgba(140, 185, 255, 0.4)",
    light: "#fff1c2",
    rim: "#a8b4c4",
  },
  "Midnight Black": {
    base: "#1a1f2a",
    highlight: "#3a4458",
    shade: "#0d1118",
    deep: "#05070c",
    glow: "rgba(163, 230, 53, 0.16)",
    glass: "rgba(15, 25, 40, 0.72)",
    glassEdge: "rgba(120, 140, 170, 0.3)",
    light: "#ffe9b0",
    rim: "#6b7585",
  },
  "Nardo Grey": {
    base: "#6b727d",
    highlight: "#9aa1ac",
    shade: "#4a515c",
    deep: "#2f353e",
    glow: "rgba(107, 114, 125, 0.38)",
    glass: "rgba(35, 45, 60, 0.58)",
    glassEdge: "rgba(170, 185, 205, 0.35)",
    light: "#fff0c8",
    rim: "#b0b8c4",
  },
  "Racing Red": {
    base: "#dc2626",
    highlight: "#f87171",
    shade: "#991b1b",
    deep: "#5c0f0f",
    glow: "rgba(220, 38, 38, 0.4)",
    glass: "rgba(40, 20, 30, 0.58)",
    glassEdge: "rgba(255, 170, 170, 0.35)",
    light: "#fff1c2",
    rim: "#b8c0cc",
  },
  Silver: {
    base: "#a8b0bc",
    highlight: "#e2e7ee",
    shade: "#7d8694",
    deep: "#4f5764",
    glow: "rgba(168, 176, 188, 0.38)",
    glass: "rgba(40, 55, 75, 0.55)",
    glassEdge: "rgba(200, 220, 240, 0.4)",
    light: "#fff6d6",
    rim: "#d0d6de",
  },
  "Storm Grey": {
    base: "#4a5564",
    highlight: "#7b8798",
    shade: "#323a46",
    deep: "#1c222c",
    glow: "rgba(74, 85, 100, 0.38)",
    glass: "rgba(25, 35, 50, 0.62)",
    glassEdge: "rgba(150, 170, 195, 0.35)",
    light: "#ffeec0",
    rim: "#9ea8b6",
  },
  "Sunset Orange": {
    base: "#ea7a2e",
    highlight: "#fbab68",
    shade: "#b45309",
    deep: "#6b2f08",
    glow: "rgba(234, 122, 46, 0.4)",
    glass: "rgba(50, 30, 20, 0.55)",
    glassEdge: "rgba(255, 200, 150, 0.35)",
    light: "#fff4cc",
    rim: "#b5bec9",
  },
  "Volcano Yellow": {
    base: "#eab308",
    highlight: "#fde047",
    shade: "#a16207",
    deep: "#633806",
    glow: "rgba(234, 179, 8, 0.4)",
    glass: "rgba(45, 40, 20, 0.5)",
    glassEdge: "rgba(255, 235, 150, 0.4)",
    light: "#fff8dc",
    rim: "#c2cad4",
  },
};

const FALLBACK_PAINT: CarPaint = {
  base: "#8b9bb8",
  highlight: "#c5d0e4",
  shade: "#5c6b86",
  deep: "#344157",
  glow: "rgba(139, 155, 184, 0.35)",
  glass: "rgba(35, 50, 75, 0.55)",
  glassEdge: "rgba(170, 195, 225, 0.35)",
  light: "#fff1c2",
  rim: "#aeb8c6",
};

export type CarBodyArt = {
  /** Outer body silhouette. */
  body: string;
  /** Greenhouse / glass. */
  glass: string;
  /** Soft character / shoulder line. */
  crease: string;
  /** Front lamp ellipse. */
  headlight: { cx: number; cy: number; rx: number; ry: number };
  /** Rear lamp ellipse. */
  taillight: { cx: number; cy: number; rx: number; ry: number };
  wheels: [{ cx: number; cy: number }, { cx: number; cy: number }];
};

/** Side profiles in viewBox 0 0 240 110 — original art per body type. */
const BODY_ART: Record<string, CarBodyArt> = {
  Coupe: {
    body: "M28 78 C32 62 42 50 58 46 L92 40 C118 36 148 38 172 48 L198 62 C206 68 214 72 222 74 L222 82 L28 82 Z",
    glass:
      "M78 48 L108 44 C128 42 148 44 164 50 L172 56 L108 56 C96 56 86 54 78 48 Z",
    crease: "M48 66 L208 66",
    headlight: { cx: 44, cy: 68, rx: 7, ry: 3.5 },
    taillight: { cx: 214, cy: 70, rx: 5, ry: 3 },
    wheels: [
      { cx: 68, cy: 82 },
      { cx: 178, cy: 82 },
    ],
  },
  Estate: {
    body: "M24 78 C28 64 38 54 54 50 L88 46 L186 46 C200 46 210 54 218 64 L226 74 L226 82 L24 82 Z",
    glass: "M78 50 L108 48 L178 48 L186 54 L108 56 C94 56 84 54 78 50 Z",
    crease: "M46 66 L214 66",
    headlight: { cx: 40, cy: 68, rx: 7, ry: 3.5 },
    taillight: { cx: 218, cy: 68, rx: 5, ry: 4 },
    wheels: [
      { cx: 66, cy: 82 },
      { cx: 176, cy: 82 },
    ],
  },
  Hatchback: {
    body: "M26 78 C30 64 40 52 56 48 L94 44 C120 42 148 46 168 56 L196 70 C204 74 214 76 222 78 L222 82 L26 82 Z",
    glass:
      "M76 50 L106 46 C126 44 146 48 160 54 L166 58 L108 58 C94 58 84 56 76 50 Z",
    crease: "M48 66 L206 66",
    headlight: { cx: 42, cy: 68, rx: 7, ry: 3.5 },
    taillight: { cx: 212, cy: 72, rx: 5, ry: 3 },
    wheels: [
      { cx: 66, cy: 82 },
      { cx: 174, cy: 82 },
    ],
  },
  Saloon: {
    body: "M24 78 C28 64 38 52 54 48 L92 44 C118 42 146 46 166 56 L196 70 C206 74 216 76 224 78 L224 82 L24 82 Z",
    glass:
      "M74 50 L106 46 C128 44 148 46 162 52 L168 58 L108 58 C94 58 82 56 74 50 Z",
    crease: "M46 66 L210 66",
    headlight: { cx: 40, cy: 68, rx: 7, ry: 3.5 },
    taillight: { cx: 214, cy: 72, rx: 5, ry: 3 },
    wheels: [
      { cx: 66, cy: 82 },
      { cx: 176, cy: 82 },
    ],
  },
  SUV: {
    body: "M22 78 C26 66 34 56 50 52 L86 48 L188 48 C202 48 212 56 220 66 L228 76 L228 82 L22 82 Z",
    glass: "M74 52 L104 50 L180 50 L186 56 L104 58 C90 58 80 56 74 52 Z",
    crease: "M44 66 L216 66",
    headlight: { cx: 38, cy: 66, rx: 7, ry: 4 },
    taillight: { cx: 220, cy: 68, rx: 5, ry: 4 },
    wheels: [
      { cx: 64, cy: 82 },
      { cx: 176, cy: 82 },
    ],
  },
};

const DEFAULT_BODY = BODY_ART.Saloon;

export function carPaint(colour: string): CarPaint {
  return PAINT[colour] ?? FALLBACK_PAINT;
}

export function carBodyArt(bodyType?: string | null): CarBodyArt {
  if (!bodyType) return DEFAULT_BODY;
  return BODY_ART[bodyType] ?? DEFAULT_BODY;
}

/** @deprecated Prefer carBodyArt — kept for older silhouette-only callers/tests. */
export function carSilhouettePath(bodyType?: string | null): string {
  return carBodyArt(bodyType).body;
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
