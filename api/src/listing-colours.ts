/**
 * Curated listing paints. Keep in sync with web `STUDIO_PAINT_COLOURS`
 * / `COLOUR_TO_PAINT` so admin + studio photos stay aligned.
 */
export const LISTING_PAINT_COLOURS = [
  "Arctic White",
  "British Racing Green",
  "Laser Blue",
  "Midnight Black",
  "Nardo Grey",
  "Racing Red",
  "Silver",
  "Storm Grey",
  "Sunset Orange",
  "Volcano Yellow",
] as const;

export type ListingPaintColour = (typeof LISTING_PAINT_COLOURS)[number];

export function isListingPaintColour(value: string): value is ListingPaintColour {
  return (LISTING_PAINT_COLOURS as readonly string[]).includes(value);
}
