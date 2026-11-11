import { listingTitle } from "../cars";
import { CarVisual } from "./CarVisual";

export type ReviewCarVisualData = {
  make: string;
  model: string;
  trimName?: string;
  bodyType?: string;
  colour: string;
  /** Linked listing year when known — improves studio photo match. */
  year?: number | null;
};

type ReviewCarThumbProps = {
  car: ReviewCarVisualData;
  /** Thumbnail for list rows; card for featured/picker; hero for review detail. */
  size?: "thumb" | "card" | "hero";
  className?: string;
};

/** Studio photo (or SVG fallback) for a review’s car model / linked listing paint. */
export function ReviewCarThumb({ car, size = "thumb", className = "" }: ReviewCarThumbProps) {
  const title = listingTitle({
    make: car.make,
    model: car.model,
    trimName: car.trimName ?? "",
  });
  const frame =
    size === "hero"
      ? `w-full ${className}`
      : size === "card"
        ? `aspect-[16/10] w-full ${className}`
        : `h-16 w-28 sm:h-[4.5rem] sm:w-32 ${className}`;
  const year = typeof car.year === "number" && car.year > 0 ? car.year : undefined;

  return (
    <CarVisual
      colour={car.colour}
      bodyType={car.bodyType}
      make={car.make}
      model={car.model}
      year={year}
      size={size}
      title={title}
      className={frame}
    />
  );
}
