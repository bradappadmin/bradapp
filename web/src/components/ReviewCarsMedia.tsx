import type { ReviewCar, ReviewType } from "../api";
import { ReviewCarThumb, type ReviewCarVisualData } from "./ReviewCarThumb";

function carLabel(car: Pick<ReviewCar, "make" | "model" | "trimName">): string {
  return `${car.make} ${car.model}${car.trimName ? ` ${car.trimName}` : ""}`;
}

function toVisualCar(car: ReviewCar): ReviewCarVisualData {
  return {
    make: car.make,
    model: car.model,
    trimName: car.trimName,
    bodyType: car.bodyType,
    colour: car.colour,
    year: car.listingYear,
  };
}

type ReviewCarsMediaProps = {
  type: ReviewType;
  car: ReviewCar;
  carB: ReviewCar | null;
  size?: "thumb" | "card";
  className?: string;
  showBadge?: boolean;
};

/** One studio thumb for a bay review, or two for a drag race. */
export function ReviewCarsMedia({
  type,
  car,
  carB,
  size = "thumb",
  className = "",
  showBadge = true,
}: ReviewCarsMediaProps) {
  if (type === "drag_race" && carB) {
    return (
      <div className={`relative ${className}`}>
        {showBadge ? (
          <span className="absolute left-2 top-2 z-10 rounded-sm border border-lime/40 bg-bay-void/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-lime">
            Drag race
          </span>
        ) : null}
        <div className={`grid grid-cols-2 gap-1 ${size === "card" ? "gap-2" : ""}`}>
          <ReviewCarThumb
            car={toVisualCar(car)}
            size={size}
            className="rounded-md border border-white/10"
          />
          <ReviewCarThumb
            car={toVisualCar(carB)}
            size={size}
            className="rounded-md border border-white/10"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <ReviewCarThumb
        car={toVisualCar(car)}
        size={size}
        className="rounded-md border border-white/10"
      />
    </div>
  );
}

export function reviewCarsCaption(type: ReviewType, car: ReviewCar, carB: ReviewCar | null): string {
  if (type === "drag_race" && carB) {
    return `${carLabel(car)} vs ${carLabel(carB)}`;
  }
  return carLabel(car);
}
