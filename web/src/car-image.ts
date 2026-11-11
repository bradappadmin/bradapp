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

/** Paint `<select>` options — curated list, plus current if it is outside the set. */
export function paintOptionsFor(current: string): string[] {
  if (STUDIO_PAINT_COLOURS.includes(current)) {
    return [...STUDIO_PAINT_COLOURS];
  }
  return [current, ...STUDIO_PAINT_COLOURS];
}

const MAKE_ALIASES: Record<string, string> = {
  "Mercedes-Benz": "mercedes",
  "Mercedes-AMG": "mercedes",
  Vauxhall: "opel",
  "Land Rover": "land rover",
  Mini: "mini",
  Skoda: "skoda",
  "Aston Martin": "aston martin",
  "Alfa Romeo": "alfa romeo",
};

/** BradApp / UK body labels → Imagin modelVariant tokens. */
const BODY_TO_VARIANT: Record<string, string> = {
  Hatchback: "hatchback",
  Saloon: "sedan",
  Sedan: "sedan",
  Estate: "estate",
  SUV: "suv",
  Coupe: "coupe",
  Convertible: "convertible",
  MPV: "mpv",
  Pickup: "pickup",
};

const FUEL_TO_POWERTRAIN: Record<string, string> = {
  Petrol: "petrol",
  Diesel: "diesel",
  Hybrid: "hybrid",
  Electric: "electric",
  PHEV: "phev",
};

export type StudioCarTokens = {
  make: string;
  modelFamily: string;
  modelRange?: string;
  modelVariant?: string;
  modelYear?: string;
  powerTrain?: string;
};

/**
 * Resolve make/model (+ optional body/year/fuel) into Imagin CDN tokens so
 * performance lines (RS6, M3, Civic Type R) map to the correct studio car.
 */
export function resolveStudioCarTokens(input: {
  make: string;
  model: string;
  bodyType?: string;
  year?: number;
  fuel?: string;
}): StudioCarTokens {
  const make = normalizeMake(input.make);
  const rawModel = input.model.trim().replace(/\s+/g, " ");
  const modelKey = rawModel.toLowerCase();

  let modelFamily = modelKey;
  let modelRange: string | undefined;

  // Audi RS / R lines — family is the base (a6), range is rs6.
  const audiRs = modelKey.match(/^rs\s*([0-9]+)$/i);
  if (make === "audi" && audiRs) {
    modelFamily = `a${audiRs[1]}`;
    modelRange = `rs${audiRs[1]}`;
  } else if (make === "audi" && /^r8$/.test(modelKey)) {
    modelFamily = "r8";
  } else if (make === "bmw" && /^m([2-8])$/.test(modelKey)) {
    const n = modelKey.replace(/^m/, "");
    modelFamily = `${n} series`;
    modelRange = `m${n}`;
  } else if (make === "bmw" && /^[1-8]\s*series$/.test(modelKey)) {
    modelFamily = modelKey.replace(/\s+/g, " ");
  } else if (/^civic type r$/.test(modelKey) || /^civic\s+type\s*r$/.test(modelKey)) {
    modelFamily = "civic";
    modelRange = "type r";
  } else if (/^golf r$/.test(modelKey)) {
    modelFamily = "golf";
    modelRange = "r";
  } else if (/^focus st$/.test(modelKey)) {
    modelFamily = "focus";
    modelRange = "st";
  } else if (/^gr supra$/.test(modelKey)) {
    modelFamily = "supra";
    modelRange = "gr";
  } else if (/^gr yaris$/.test(modelKey)) {
    modelFamily = "yaris";
    modelRange = "gr";
  } else if (make === "mercedes" && /^c\s*63/.test(modelKey)) {
    modelFamily = "c-class";
    modelRange = "c 63";
  } else if (make === "mercedes" && /^a\s*45/.test(modelKey)) {
    modelFamily = "a-class";
    modelRange = "a 45";
  } else if (make === "mercedes" && /^c-class$/.test(modelKey)) {
    modelFamily = "c-class";
  } else if (make === "mercedes" && /^glc$/.test(modelKey)) {
    modelFamily = "glc";
  } else if (/^gt-r$/.test(modelKey) || /^gtr$/.test(modelKey)) {
    modelFamily = "gt-r";
  } else if (/^mx-5$/.test(modelKey) || /^mx5$/.test(modelKey)) {
    modelFamily = "mx-5";
  } else if (/^cr-v$/.test(modelKey)) {
    modelFamily = "cr-v";
  } else if (/^cx-5$/.test(modelKey)) {
    modelFamily = "cx-5";
  } else if (/^f-type$/.test(modelKey)) {
    modelFamily = "f-type";
  } else if (/^range rover sport$/.test(modelKey)) {
    modelFamily = "range rover sport";
  } else if (/^model [3y]$/.test(modelKey)) {
    modelFamily = modelKey;
  } else if (/^sf90 stradale$/.test(modelKey)) {
    modelFamily = "sf90";
  } else {
    modelFamily = MODEL_FAMILY_ALIASES[modelKey] ?? modelKey;
  }

  const modelVariant = input.bodyType ? BODY_TO_VARIANT[input.bodyType] : undefined;
  const powerTrain = input.fuel ? FUEL_TO_POWERTRAIN[input.fuel] : undefined;
  const modelYear =
    typeof input.year === "number" && Number.isFinite(input.year) && input.year >= 1990
      ? String(Math.trunc(input.year))
      : undefined;

  return {
    make,
    modelFamily,
    ...(modelRange ? { modelRange } : {}),
    ...(modelVariant ? { modelVariant } : {}),
    ...(modelYear ? { modelYear } : {}),
    ...(powerTrain ? { powerTrain } : {}),
  };
}

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
  "civic type r": "civic",
  huracán: "huracan",
  "720s": "720s",
};

function normalizeMake(make: string): string {
  return (MAKE_ALIASES[make] ?? make).trim().toLowerCase();
}

/** Imagin modelFamily prefers the core name without trim fluff. */
export function normalizeModelFamily(model: string): string {
  return resolveStudioCarTokens({ make: "Generic", model }).modelFamily;
}

export type CarImageInput = {
  make: string;
  model: string;
  colour?: string;
  bodyType?: string;
  year?: number;
  fuel?: string;
  /** Thumbnail ~480, card ~800, hero ~1400. */
  width?: number;
  /** Studio camera angle; 23 is a common ¾ front. */
  angle?: string;
};

/**
 * Free `customer=img` returns a covered-car stub for these makes.
 * Skip the studio URL so UI falls back to Midnight Garage SVG art unless a
 * licensed `VITE_CAR_IMAGE_CUSTOMER` is configured.
 */
const DEMO_UNSUPPORTED_MAKES = new Set(["ferrari"]);

/**
 * Builds a white-studio image URL for a real make/model.
 * Uses the public Imagin CDN customer; override with VITE_CAR_IMAGE_CUSTOMER if needed
 * (licensed keys drop the demo watermark / plate branding).
 * Returns null when the free demo customer cannot render the make.
 */
export function carStudioImageUrl(input: CarImageInput): string | null {
  const customer = (import.meta.env.VITE_CAR_IMAGE_CUSTOMER as string | undefined)?.trim() || "img";
  const tokens = resolveStudioCarTokens(input);
  if (customer === "img" && DEMO_UNSUPPORTED_MAKES.has(tokens.make)) {
    return null;
  }
  const params = new URLSearchParams({
    customer,
    make: tokens.make,
    modelFamily: tokens.modelFamily,
    angle: input.angle ?? "23",
    zoomType: "fullscreen",
    width: String(input.width ?? 800),
    // White seamless studio — matches product cards/heroes across the bay.
    backgroundColor: "255,255,255,255",
    // Transparent-capable formats sit cleanly on the white studio plane.
    fileType: "webp",
  });
  if (tokens.modelRange) params.set("modelRange", tokens.modelRange);
  if (tokens.modelVariant) params.set("modelVariant", tokens.modelVariant);
  if (tokens.modelYear) params.set("modelYear", tokens.modelYear);
  if (tokens.powerTrain) params.set("powerTrain", tokens.powerTrain);
  const paint = input.colour ? COLOUR_TO_PAINT[input.colour] : undefined;
  if (paint) params.set("paintDescription", paint);
  return `https://cdn.imagin.studio/getImage?${params.toString()}`;
}

/** True when studio URLs use a licensed Imagin customer (demo watermark / plate branding off). */
export function usesLicensedCarStudio(): boolean {
  const customer = (import.meta.env.VITE_CAR_IMAGE_CUSTOMER as string | undefined)?.trim();
  return Boolean(customer && customer !== "img");
}
