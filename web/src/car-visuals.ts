/** Original Midnight Garage car art — photoreal-leaning ¾ profiles, not stock photos. */

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
  chrome: string;
};

const PAINT: Record<string, CarPaint> = {
  "Arctic White": {
    base: "#e8eef7",
    highlight: "#ffffff",
    shade: "#b8c4d6",
    deep: "#8a97ab",
    glow: "rgba(232, 238, 247, 0.28)",
    glass: "rgba(55, 80, 115, 0.62)",
    glassEdge: "rgba(200, 220, 245, 0.55)",
    light: "#fff8e0",
    rim: "#d5dbe4",
    chrome: "#f2f5f8",
  },
  "British Racing Green": {
    base: "#1f6b4f",
    highlight: "#3fa87a",
    shade: "#134836",
    deep: "#0a2a1f",
    glow: "rgba(31, 107, 79, 0.4)",
    glass: "rgba(18, 40, 36, 0.7)",
    glassEdge: "rgba(130, 190, 160, 0.35)",
    light: "#ffe9a8",
    rim: "#aeb8c4",
    chrome: "#d7dde6",
  },
  "Laser Blue": {
    base: "#2563eb",
    highlight: "#60a5fa",
    shade: "#1d4ed8",
    deep: "#12307a",
    glow: "rgba(37, 99, 235, 0.42)",
    glass: "rgba(20, 40, 85, 0.68)",
    glassEdge: "rgba(150, 195, 255, 0.42)",
    light: "#fff1c2",
    rim: "#b4becb",
    chrome: "#e4e9f0",
  },
  "Midnight Black": {
    base: "#1a1f2a",
    highlight: "#4a5568",
    shade: "#0d1118",
    deep: "#05070c",
    glow: "rgba(163, 230, 53, 0.14)",
    glass: "rgba(12, 20, 32, 0.78)",
    glassEdge: "rgba(130, 150, 180, 0.28)",
    light: "#ffe9b0",
    rim: "#7a8494",
    chrome: "#c5ccd6",
  },
  "Nardo Grey": {
    base: "#6b727d",
    highlight: "#9aa1ac",
    shade: "#4a515c",
    deep: "#2f353e",
    glow: "rgba(107, 114, 125, 0.38)",
    glass: "rgba(30, 40, 55, 0.65)",
    glassEdge: "rgba(180, 195, 215, 0.35)",
    light: "#fff0c8",
    rim: "#c0c7d0",
    chrome: "#e8ecf1",
  },
  "Racing Red": {
    base: "#dc2626",
    highlight: "#fb7185",
    shade: "#991b1b",
    deep: "#5c0f0f",
    glow: "rgba(220, 38, 38, 0.4)",
    glass: "rgba(35, 15, 25, 0.65)",
    glassEdge: "rgba(255, 180, 180, 0.35)",
    light: "#fff1c2",
    rim: "#c4ccd6",
    chrome: "#eceff3",
  },
  Silver: {
    base: "#a8b0bc",
    highlight: "#e8edf4",
    shade: "#7d8694",
    deep: "#4f5764",
    glow: "rgba(168, 176, 188, 0.38)",
    glass: "rgba(35, 50, 70, 0.6)",
    glassEdge: "rgba(210, 225, 245, 0.42)",
    light: "#fff6d6",
    rim: "#d8dee6",
    chrome: "#f5f7fa",
  },
  "Storm Grey": {
    base: "#4a5564",
    highlight: "#7b8798",
    shade: "#323a46",
    deep: "#1c222c",
    glow: "rgba(74, 85, 100, 0.38)",
    glass: "rgba(22, 30, 45, 0.68)",
    glassEdge: "rgba(155, 175, 200, 0.35)",
    light: "#ffeec0",
    rim: "#a8b2c0",
    chrome: "#dde3ea",
  },
  "Sunset Orange": {
    base: "#ea7a2e",
    highlight: "#fbab68",
    shade: "#b45309",
    deep: "#6b2f08",
    glow: "rgba(234, 122, 46, 0.4)",
    glass: "rgba(45, 25, 18, 0.62)",
    glassEdge: "rgba(255, 205, 160, 0.35)",
    light: "#fff4cc",
    rim: "#c0c8d2",
    chrome: "#eceff3",
  },
  "Volcano Yellow": {
    base: "#eab308",
    highlight: "#fde047",
    shade: "#a16207",
    deep: "#633806",
    glow: "rgba(234, 179, 8, 0.4)",
    glass: "rgba(40, 35, 15, 0.55)",
    glassEdge: "rgba(255, 240, 160, 0.4)",
    light: "#fff8dc",
    rim: "#ccd4dc",
    chrome: "#f2f5f8",
  },
};

const FALLBACK_PAINT: CarPaint = {
  base: "#8b9bb8",
  highlight: "#c5d0e4",
  shade: "#5c6b86",
  deep: "#344157",
  glow: "rgba(139, 155, 184, 0.35)",
  glass: "rgba(30, 45, 70, 0.6)",
  glassEdge: "rgba(175, 200, 230, 0.35)",
  light: "#fff1c2",
  rim: "#b8c2d0",
  chrome: "#e8edf3",
};

/**
 * Compact ¾ front-side art in viewBox 0 0 200 120.
 * Paths are original BradApp drawings — body type changes greenhouse / height.
 */
export type CarBodyArt = {
  /** Main body mass (hood → flanks → rear). */
  body: string;
  /** Soft under-shadow glued to the body. */
  under: string;
  /** Cabin glass. */
  glass: string;
  /** Lower grille / intake. */
  grille: string;
  /** Front lamp. */
  headlight: { cx: number; cy: number; rx: number; ry: number };
  /** Rear lamp. */
  taillight: { cx: number; cy: number; rx: number; ry: number };
  /** Near (larger) then far wheel. */
  wheels: [{ cx: number; cy: number; r: number }, { cx: number; cy: number; r: number }];
  /** Optional roof rail / spoiler hint. */
  accent?: string;
};

const BODY_ART: Record<string, CarBodyArt> = {
  Coupe: {
    body: "M18 86 C22 70 34 54 58 48 L92 40 C118 34 142 36 160 48 L178 62 C186 70 190 78 192 86 L18 86 Z",
    under: "M24 86 Q105 94 186 86 L186 90 Q105 100 24 90 Z",
    glass: "M78 48 L108 42 C124 40 140 44 150 52 L154 58 L108 60 C94 60 84 56 78 48 Z",
    grille: "M28 72 L52 70 L54 78 L30 80 Z",
    headlight: { cx: 40, cy: 68, rx: 9, ry: 4 },
    taillight: { cx: 180, cy: 70, rx: 5, ry: 3.5 },
    wheels: [
      { cx: 58, cy: 88, r: 16 },
      { cx: 152, cy: 88, r: 14 },
    ],
    accent: "M96 40 C120 36 140 40 154 48",
  },
  Estate: {
    body: "M16 86 C20 72 30 58 52 52 L86 46 L158 46 C170 46 180 54 186 66 L192 86 L16 86 Z",
    under: "M22 86 Q104 96 188 86 L188 91 Q104 102 22 91 Z",
    glass: "M74 52 L100 48 L154 48 L160 56 L100 58 C88 58 80 56 74 52 Z",
    grille: "M26 72 L50 70 L52 78 L28 80 Z",
    headlight: { cx: 38, cy: 68, rx: 9, ry: 4 },
    taillight: { cx: 182, cy: 66, rx: 5, ry: 5 },
    wheels: [
      { cx: 56, cy: 88, r: 16 },
      { cx: 150, cy: 88, r: 14 },
    ],
    accent: "M86 46 L158 46",
  },
  Hatchback: {
    body: "M18 86 C22 70 34 56 56 50 L90 44 C118 40 142 46 158 58 L178 72 C184 78 188 82 192 86 L18 86 Z",
    under: "M24 86 Q104 95 186 86 L186 91 Q104 101 24 91 Z",
    glass: "M76 50 L106 44 C124 42 140 48 150 56 L152 60 L106 62 C92 62 82 58 76 50 Z",
    grille: "M28 72 L50 70 L52 78 L30 80 Z",
    headlight: { cx: 40, cy: 68, rx: 9, ry: 4 },
    taillight: { cx: 178, cy: 72, rx: 5, ry: 3.5 },
    wheels: [
      { cx: 56, cy: 88, r: 16 },
      { cx: 148, cy: 88, r: 14 },
    ],
  },
  Saloon: {
    body: "M16 86 C20 70 32 56 54 50 L90 44 C116 40 140 44 156 56 L178 72 C184 78 188 82 192 86 L16 86 Z",
    under: "M22 86 Q104 95 186 86 L186 91 Q104 101 22 91 Z",
    glass: "M74 50 L106 44 C124 42 142 46 152 54 L154 60 L106 62 C92 62 80 58 74 50 Z",
    grille: "M26 72 L50 70 L52 78 L28 80 Z",
    headlight: { cx: 38, cy: 68, rx: 9, ry: 4 },
    taillight: { cx: 180, cy: 72, rx: 5, ry: 3.5 },
    wheels: [
      { cx: 56, cy: 88, r: 16 },
      { cx: 150, cy: 88, r: 14 },
    ],
  },
  SUV: {
    body: "M14 86 C18 74 26 60 48 54 L84 48 L162 48 C174 48 182 58 188 70 L194 86 L14 86 Z",
    under: "M20 86 Q104 98 190 86 L190 92 Q104 104 20 92 Z",
    glass: "M72 54 L100 50 L156 50 L160 58 L100 60 C86 60 78 58 72 54 Z",
    grille: "M24 70 L52 68 L54 78 L26 80 Z",
    headlight: { cx: 36, cy: 66, rx: 9, ry: 4.5 },
    taillight: { cx: 184, cy: 68, rx: 5, ry: 5 },
    wheels: [
      { cx: 54, cy: 88, r: 17 },
      { cx: 152, cy: 88, r: 15 },
    ],
    accent: "M84 48 L162 48",
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
