/** Studio car renders for listing cards/heroes.
 * Licensed Imagin customer → photoreal CDN (no demo watermark).
 * Otherwise → self-hosted white-studio SVG data URL (never free Imagin; that watermarks).
 */
import { carBodyArt, carPaint } from "./car-visuals";


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
 * Builds a watermark-free white-studio image URL for a real make/model.
 * - Licensed `VITE_CAR_IMAGE_CUSTOMER` → Imagin CDN (white bg, no demo watermark).
 * - Otherwise → original SVG studio data URL (never free `customer=img`, which watermarks).
 */
export function carStudioImageUrl(input: CarImageInput): string | null {
  if (usesLicensedCarStudio()) {
    return licensedImaginStudioUrl(input);
  }
  return carStudioSvgDataUrl(input);
}

/** True when studio URLs use a licensed Imagin customer (demo watermark / plate branding off). */
export function usesLicensedCarStudio(): boolean {
  const customer = (import.meta.env.VITE_CAR_IMAGE_CUSTOMER as string | undefined)?.trim();
  return Boolean(customer && customer !== "img");
}

function licensedImaginStudioUrl(input: CarImageInput): string {
  const customer = (import.meta.env.VITE_CAR_IMAGE_CUSTOMER as string).trim();
  const tokens = resolveStudioCarTokens(input);
  const params = new URLSearchParams({
    customer,
    make: tokens.make,
    modelFamily: tokens.modelFamily,
    angle: input.angle ?? "23",
    zoomType: "fullscreen",
    width: String(input.width ?? 800),
    backgroundColor: "255,255,255,255",
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

/** Original white-studio SVG — photoreal-leaning ¾ car, no third-party watermark. */
export function carStudioSvgDataUrl(input: CarImageInput): string {
  const paint = carPaint(input.colour ?? "Arctic White");
  const art = carBodyArt(input.bodyType);
  const uid = "s";
  const accent = art.accent
    ? `<path d="${art.accent}" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.4" stroke-linecap="round"/>`
    : "";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="${input.width ?? 800}" role="img">
  <defs>
    <linearGradient id="${uid}-studio" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="55%" stop-color="#f4f6f8"/>
      <stop offset="100%" stop-color="#e8ecf1"/>
    </linearGradient>
    <linearGradient id="${uid}-body" x1="0.15" y1="0" x2="0.55" y2="1">
      <stop offset="0%" stop-color="${paint.highlight}"/>
      <stop offset="32%" stop-color="${paint.base}"/>
      <stop offset="72%" stop-color="${paint.shade}"/>
      <stop offset="100%" stop-color="${paint.deep}"/>
    </linearGradient>
    <linearGradient id="${uid}-glass" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="${paint.glassEdge}"/>
      <stop offset="40%" stop-color="${paint.glass}"/>
      <stop offset="100%" stop-color="rgba(6,10,18,0.82)"/>
    </linearGradient>
    <linearGradient id="${uid}-shine" x1="0" y1="0" x2="1" y2="0.15">
      <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
      <stop offset="28%" stop-color="rgba(255,255,255,0.42)"/>
      <stop offset="48%" stop-color="rgba(255,255,255,0.1)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <rect width="200" height="120" fill="url(#${uid}-studio)"/>
  <ellipse cx="100" cy="102" rx="78" ry="8" fill="${paint.glow}"/>
  <ellipse cx="100" cy="100" rx="70" ry="5" fill="rgba(15,23,42,0.12)"/>
  <path d="${art.under}" fill="rgba(15,23,42,0.18)"/>
  <path d="${art.body}" fill="url(#${uid}-body)"/>
  <path d="${art.body}" fill="url(#${uid}-shine)" opacity="0.7"/>
  ${accent}
  <path d="${art.glass}" fill="url(#${uid}-glass)" stroke="rgba(255,255,255,0.16)" stroke-width="0.9"/>
  <path d="${art.grille}" fill="${paint.deep}" opacity="0.9"/>
  <ellipse cx="${art.headlight.cx}" cy="${art.headlight.cy}" rx="${art.headlight.rx}" ry="${art.headlight.ry}" fill="${paint.light}" opacity="0.95"/>
  <ellipse cx="${art.taillight.cx}" cy="${art.taillight.cy}" rx="${art.taillight.rx}" ry="${art.taillight.ry}" fill="#ef4444" opacity="0.92"/>
  <g>
    <ellipse cx="${art.wheels[0].cx}" cy="${art.wheels[0].cy + art.wheels[0].r * 0.22}" rx="${art.wheels[0].r * 1.05}" ry="${art.wheels[0].r * 0.22}" fill="rgba(0,0,0,0.28)"/>
    <circle cx="${art.wheels[0].cx}" cy="${art.wheels[0].cy}" r="${art.wheels[0].r}" fill="#090c12"/>
    <circle cx="${art.wheels[0].cx}" cy="${art.wheels[0].cy}" r="${art.wheels[0].r * 0.62}" fill="${paint.rim}"/>
    <circle cx="${art.wheels[0].cx}" cy="${art.wheels[0].cy}" r="${art.wheels[0].r * 0.22}" fill="${paint.rim}" stroke="${paint.chrome}" stroke-width="0.8"/>
  </g>
  <g>
    <ellipse cx="${art.wheels[1].cx}" cy="${art.wheels[1].cy + art.wheels[1].r * 0.22}" rx="${art.wheels[1].r * 1.05}" ry="${art.wheels[1].r * 0.22}" fill="rgba(0,0,0,0.28)"/>
    <circle cx="${art.wheels[1].cx}" cy="${art.wheels[1].cy}" r="${art.wheels[1].r}" fill="#090c12"/>
    <circle cx="${art.wheels[1].cx}" cy="${art.wheels[1].cy}" r="${art.wheels[1].r * 0.62}" fill="${paint.rim}"/>
    <circle cx="${art.wheels[1].cx}" cy="${art.wheels[1].cy}" r="${art.wheels[1].r * 0.22}" fill="${paint.rim}" stroke="${paint.chrome}" stroke-width="0.8"/>
  </g>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
