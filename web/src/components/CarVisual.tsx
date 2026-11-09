import { useId } from "react";
import { carBodyArt, carPaint } from "../car-visuals";

type CarVisualProps = {
  colour: string;
  bodyType?: string;
  /** Thumbnail strip vs listing hero. */
  size?: "thumb" | "hero";
  title?: string;
  className?: string;
};

function AlloyWheel({
  cx,
  cy,
  rim,
  size,
}: {
  cx: number;
  cy: number;
  rim: string;
  size: "thumb" | "hero";
}) {
  const tireR = size === "hero" ? 14 : 13;
  const rimR = size === "hero" ? 8.5 : 7.5;
  const hubR = size === "hero" ? 3.2 : 2.8;
  return (
    <g>
      <ellipse cx={cx} cy={cy + 2.5} rx={tireR + 1} ry={3} fill="rgba(0,0,0,0.35)" />
      <circle cx={cx} cy={cy} r={tireR} fill="#0a0d14" />
      <circle cx={cx} cy={cy} r={tireR - 1.5} fill="#151a24" stroke="#2a3140" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={rimR} fill={rim} opacity={0.95} />
      <circle cx={cx} cy={cy} r={rimR - 1.8} fill="#1c2230" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x2 = cx + Math.cos(rad) * (rimR - 2.2);
        const y2 = cy + Math.sin(rad) * (rimR - 2.2);
        return (
          <line
            key={deg}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke={rim}
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={0.85}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={hubR} fill={rim} />
      <circle cx={cx - 2} cy={cy - 2} r={1.2} fill="rgba(255,255,255,0.35)" />
    </g>
  );
}

/** Layered side-profile car with metallic paint, glass, lamps, and alloys. */
export function CarVisual({
  colour,
  bodyType,
  size = "thumb",
  title,
  className = "",
}: CarVisualProps) {
  const uid = useId().replace(/:/g, "");
  const paint = carPaint(colour);
  const art = carBodyArt(bodyType);
  const bodyGrad = `paint-${uid}`;
  const glassGrad = `glass-${uid}`;
  const bayGrad = `bay-${uid}`;
  const shineGrad = `shine-${uid}`;

  const isHero = size === "hero";
  const frameClass = isHero
    ? `relative mt-6 overflow-hidden rounded-md border border-white/10 ${className}`
    : `relative shrink-0 overflow-hidden rounded-md border border-white/10 ${className}`;

  const svg = (
    <svg
      viewBox="0 0 240 110"
      className={isHero ? "h-28 w-full max-w-xl sm:h-36" : "h-full w-full"}
      aria-hidden={isHero || !title ? true : undefined}
      role={!isHero && title ? "img" : undefined}
      aria-label={!isHero && title ? `${title} in ${colour}` : undefined}
    >
      <defs>
        <linearGradient id={bayGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#152038" />
          <stop offset="55%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#070b14" />
        </linearGradient>
        <linearGradient id={bodyGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={paint.highlight} />
          <stop offset="38%" stopColor={paint.base} />
          <stop offset="78%" stopColor={paint.shade} />
          <stop offset="100%" stopColor={paint.deep} />
        </linearGradient>
        <linearGradient id={glassGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={paint.glassEdge} />
          <stop offset="55%" stopColor={paint.glass} />
          <stop offset="100%" stopColor="rgba(8,12,20,0.75)" />
        </linearGradient>
        <linearGradient id={shineGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="30%" cy="35%" r="55%">
          <stop offset="0%" stopColor={paint.glow} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <rect width="240" height="110" fill={`url(#${bayGrad})`} />
      <rect width="240" height="110" fill={`url(#${uid}-glow)`} />

      {/* Garage floor */}
      <ellipse cx="120" cy="96" rx="96" ry="8" fill="rgba(0,0,0,0.45)" />
      <path
        d="M40 94 Q120 88 200 94"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="2"
      />

      {/* Soft underbody shadow */}
      <ellipse
        cx={(art.wheels[0].cx + art.wheels[1].cx) / 2}
        cy={88}
        rx={78}
        ry={7}
        fill="rgba(0,0,0,0.5)"
      />

      <path d={art.body} fill={`url(#${bodyGrad})`} />
      <path d={art.body} fill={`url(#${shineGrad})`} opacity={0.55} />
      <path
        d={art.crease}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <path
        d={art.glass}
        fill={`url(#${glassGrad})`}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.8}
      />

      {/* Door hint */}
      <path
        d={`M120 56 L120 78`}
        fill="none"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth={1}
      />

      <ellipse
        cx={art.headlight.cx}
        cy={art.headlight.cy}
        rx={art.headlight.rx}
        ry={art.headlight.ry}
        fill={paint.light}
        opacity={0.95}
      />
      <ellipse
        cx={art.headlight.cx - 1}
        cy={art.headlight.cy}
        rx={art.headlight.rx * 0.45}
        ry={art.headlight.ry * 0.55}
        fill="#fff"
        opacity={0.55}
      />
      <ellipse
        cx={art.taillight.cx}
        cy={art.taillight.cy}
        rx={art.taillight.rx}
        ry={art.taillight.ry}
        fill="#ef4444"
        opacity={0.9}
      />

      <AlloyWheel cx={art.wheels[0].cx} cy={art.wheels[0].cy} rim={paint.rim} size={size} />
      <AlloyWheel cx={art.wheels[1].cx} cy={art.wheels[1].cy} rim={paint.rim} size={size} />
    </svg>
  );

  if (isHero) {
    return (
      <div
        className={frameClass}
        style={{
          background: `linear-gradient(120deg, ${paint.glow}, transparent 55%), #070b14`,
        }}
        role={title ? "img" : undefined}
        aria-label={title ? `${title} in ${colour}` : undefined}
      >
        <span
          className="absolute inset-y-0 left-0 w-2 sm:w-3"
          style={{ backgroundColor: paint.base }}
          aria-hidden
        />
        <div className="flex min-h-[9rem] items-end justify-center px-4 pb-3 pt-6 sm:min-h-[12rem] sm:px-8">
          {svg}
        </div>
      </div>
    );
  }

  return (
    <div
      className={frameClass}
      style={{
        background: `linear-gradient(145deg, ${paint.glow}, transparent 50%), #0b1220`,
      }}
      aria-hidden
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: paint.base }}
      />
      <div className="absolute inset-0">{svg}</div>
    </div>
  );
}
