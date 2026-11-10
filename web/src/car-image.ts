/** Studio car renders for listing cards/heroes. Falls back to local SVG art if unloadable. */

/** Listing paint names the studio helper maps to Imagin paintDescription. */
const COLOUR_TO_PAINT: Record<string, string> = {
  "Arctic White": "White",
  "British Racing Green": "British Racing Green",
  "Laser Blue": "Blue",
  "Midnight Black": "Black",
  "Nardo Grey": "Nardo Grey",
  "Racing Red": "Red",
  Silver: "Silver",
  "Storm Grey": "Grey",
  "Sunset Orange": "Orange",
  "Volcano Yellow": "Yellow",
};

/** Curated bay paints for admin listing forms (matches studio URL helper). */
export const STUDIO_PAINT_COLOURS = Object.keys(COLOUR_TO_PAINT).sort((a, b) =>
  a.localeCompare(b),
);

const MAKE_ALIASES: Record<string, string> = {
  "Mercedes-Benz": "mercedes",
  Vauxhall: "opel",
  "Land Rover": "land rover",
  Mini: "mini",
  Skoda: "skoda",
};

/** Prefer sharper modelFamily tokens the studio CDN recognises. */
const MODEL_FAMILY_ALIASES: Record<string, string> = {
  "3 series": "3 series",
  "c-class": "c-class",
  "model 3": "model 3",
  "model y": "model y",
  "range rover sport": "range rover sport",
  "gt-r": "gt-r",
  "f-type": "f-type",
  "mx-5": "mx-5",
  "cr-v": "cr-v",
  "cx-5": "cx-5",
  "civic type r": "civic type r",
};

function normalizeMake(make: string): string {
  return (MAKE_ALIASES[make] ?? make).trim().toLowerCase();
}

/** Imagin modelFamily prefers the core name without trim fluff. */
export function normalizeModelFamily(model: string): string {
  const key = model.trim().toLowerCase().replace(/\s+/g, " ");
  return MODEL_FAMILY_ALIASES[key] ?? key;
}

export type CarImageInput = {
  make: string;
  model: string;
  colour?: string;
  /** Thumbnail ~480, card ~720, hero ~1200. */
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
    width: String(input.width ?? 720),
    // Transparent-capable PNG reads cleaner on the bay background when supported.
    fileType: "webp",
  });
  const paint = input.colour ? COLOUR_TO_PAINT[input.colour] : undefined;
  if (paint) params.set("paintDescription", paint);
  return `https://cdn.imagin.studio/getImage?${params.toString()}`;
}
