import { listingTitle } from "../cars";
import { CarVisual } from "./CarVisual";

export type ReviewCarVisualData = {
  make: string;
  model: string;
  trimName?: string;
  bodyType?: string;
  colour: string;
};

type ReviewCarThumbProps = {
  car: ReviewCarVisualData;
  /** Thumbnail for list rows; card for detail/featured/picker. */
  size?: "thumb" | "card";
  className?: string;
};

/** Studio photo (or SVG fallback) for a review’s car model. */
export function ReviewCarThumb({ car, size = "thumb", className = "" }: ReviewCarThumbProps) {
  const title = listingTitle({
    make: car.make,
    model: car.model,
    trimName: car.trimName ?? "",
  });
  const frame =
    size === "card"
      ? `aspect-[16/10] w-full ${className}`
      : `h-16 w-28 sm:h-[4.5rem] sm:w-32 ${className}`;

  return (
    <CarVisual
      colour={car.colour}
      bodyType={car.bodyType}
      make={car.make}
      model={car.model}
      size={size}
      title={title}
      className={frame}
    />
  );
}
