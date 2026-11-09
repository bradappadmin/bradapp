/** Studio car renders for listing cards/heroes. Falls back to local SVG art if unloadable. */

const COLOUR_TO_PAINT: Record<string, string> = {
  "Arctic White": "White",
  "British Racing Green": "Green",
  "Laser Blue": "Blue",
  "Midnight Black": "Black",
  "Nardo Grey": "Grey",
  "Racing Red": "Red",
  Silver: "Silver",
  "Storm Grey": "Grey",
  "Sunset Orange": "Orange",
  "Volcano Yellow": "Yellow",
};

const MAKE_ALIASES: Record<string, string> = {
  "Mercedes-Benz": "mercedes",
  Vauxhall: "opel",
  "Land Rover": "land rover",
  Mini: "mini",
  Skoda: "skoda",
};

function normalizeMake(make: string): string {
  return (MAKE_ALIASES[make] ?? make).trim().toLowerCase();
}

/** Imagin modelFamily prefers the core name without trim fluff. */
function normalizeModelFamily(model: string): string {
  return model
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export type CarImageInput = {
  make: string;
  model: string;
  colour?: string;
  /** Thumbnail ~360, hero ~800. */
  width?: number;
  /** Studio camera angle; 23 is a common ¾ front. */
  angle?: string;
};

/**
 * Builds a studio image URL for a real make/model.
 * Uses the public Imagin CDN customer; override with VITE_CAR_IMAGE_CUSTOMER if needed.
 */
export function carStudioImageUrl(input: CarImageInput): string {
  const customer = (import.meta.env.VITE_CAR_IMAGE_CUSTOMER as string | undefined)?.trim() || "img";
  const params = new URLSearchParams({
    customer,
    make: normalizeMake(input.make),
    modelFamily: normalizeModelFamily(input.model),
    angle: input.angle ?? "23",
    zoomType: "fullscreen",
    width: String(input.width ?? 400),
  });
  const paint = input.colour ? COLOUR_TO_PAINT[input.colour] : undefined;
  if (paint) params.set("paintDescription", paint);
  return `https://cdn.imagin.studio/getImage?${params.toString()}`;
}
