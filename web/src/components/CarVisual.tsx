import { useId, useState } from "react";
import { carStudioImageUrl } from "../car-image";
import { carBodyArt, carPaint, type CarPaint } from "../car-visuals";

type CarVisualProps = {
  colour: string;
  bodyType?: string;
  make?: string;
  model?: string;
  year?: number;
  fuel?: string;
  /** Thumbnail strip, photo-first card, or listing hero. */
  size?: "thumb" | "card" | "hero";
  title?: string;
  className?: string;
};

function AlloyWheel({
  cx,
  cy,
  r,
  rim,
  chrome,
}: {
  cx: number;
  cy: number;
  r: number;
  rim: string;
  chrome: string;
}) {
  const tire = r;
  const rimR = r * 0.62;
  const hubR = r * 0.22;
  return (
    <g>
      <ellipse cx={cx} cy={cy + r * 0.22} rx={r * 1.05} ry={r * 0.22} fill="rgba(0,0,0,0.45)" />
      <circle cx={cx} cy={cy} r={tire} fill="#090c12" />
      <circle
        cx={cx}
        cy={cy}
        r={tire - 1.2}
        fill="#141923"
        stroke="#2c3444"
        strokeWidth={1.2}
      />
      <circle cx={cx} cy={cy} r={rimR} fill={rim} />
      <circle cx={cx} cy={cy} r={rimR * 0.78} fill="#1a2030" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const inner = hubR + 0.5;
        const outer = rimR * 0.72;
        return (
          <line
            key={deg}
            x1={cx + Math.cos(rad) * inner}
            y1={cy + Math.sin(rad) * inner}
            x2={cx + Math.cos(rad) * outer}
            y2={cy + Math.sin(rad) * outer}
            stroke={chrome}
            strokeWidth={1.6}
            strokeLinecap="round"
            opacity={0.9}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={hubR} fill={rim} stroke={chrome} strokeWidth={0.8} />
      <circle cx={cx - r * 0.18} cy={cy - r * 0.18} r={r * 0.1} fill="rgba(255,255,255,0.35)" />
    </g>
  );
}

function FallbackSvg({
  colour,
  bodyType,
  size,
  title,
}: {
  colour: string;
  bodyType?: string;
  size: "thumb" | "card" | "hero";
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const paint = carPaint(colour);
  const isHero = size === "hero";
  const art = carBodyArt(bodyType);
  const bodyGrad = `paint-${uid}`;
  const glassGrad = `glass-${uid}`;
  const bayGrad = `bay-${uid}`;
  const shineGrad = `shine-${uid}`;
  const floorGrad = `floor-${uid}`;

  return (
    <svg
      viewBox="0 0 200 120"
      className={isHero ? "h-full w-full max-w-5xl" : "h-full w-full"}
      aria-hidden={isHero || !title ? true : undefined}
      role={!isHero && title ? "img" : undefined}
      aria-label={!isHero && title ? `${title} in ${colour}` : undefined}
    >
      <defs>
        <linearGradient id={bayGrad} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#1a2740" />
          <stop offset="45%" stopColor="#0d1524" />
          <stop offset="100%" stopColor="#070b14" />
        </linearGradient>
        <linearGradient id={floorGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </linearGradient>
        <linearGradient id={bodyGrad} x1="0.15" y1="0" x2="0.55" y2="1">
          <stop offset="0%" stopColor={paint.highlight} />
          <stop offset="32%" stopColor={paint.base} />
          <stop offset="72%" stopColor={paint.shade} />
          <stop offset="100%" stopColor={paint.deep} />
        </linearGradient>
        <linearGradient id={glassGrad} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor={paint.glassEdge} />
          <stop offset="40%" stopColor={paint.glass} />
          <stop offset="100%" stopColor="rgba(6,10,18,0.82)" />
        </linearGradient>
        <linearGradient id={shineGrad} x1="0" y1="0" x2="1" y2="0.15">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="28%" stopColor="rgba(255,255,255,0.38)" />
          <stop offset="48%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="28%" cy="30%" r="60%">
          <stop offset="0%" stopColor={paint.glow} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <rect width="200" height="120" fill={`url(#${bayGrad})`} />
      <rect width="200" height="120" fill={`url(#${uid}-glow)`} />
      <rect x="0" y="86" width="200" height="34" fill={`url(#${floorGrad})`} />
      <ellipse cx="100" cy="102" rx="78" ry="7" fill="rgba(0,0,0,0.4)" />
      <path d={art.under} fill="rgba(0,0,0,0.55)" />
      <path d={art.body} fill={`url(#${bodyGrad})`} />
      <path d={art.body} fill={`url(#${shineGrad})`} opacity={0.65} />
      {art.accent ? (
        <path
          d={art.accent}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      ) : null}
      <path
        d={art.glass}
        fill={`url(#${glassGrad})`}
        stroke="rgba(255,255,255,0.14)"
        strokeWidth={0.9}
      />
      <path d={art.grille} fill={paint.deep} opacity={0.85} />
      <ellipse
        cx={art.headlight.cx}
        cy={art.headlight.cy}
        rx={art.headlight.rx}
        ry={art.headlight.ry}
        fill={paint.light}
        opacity={0.95}
      />
      <ellipse
        cx={art.taillight.cx}
        cy={art.taillight.cy}
        rx={art.taillight.rx}
        ry={art.taillight.ry}
        fill="#ef4444"
        opacity={0.92}
      />
      <AlloyWheel
        cx={art.wheels[0].cx}
        cy={art.wheels[0].cy}
        r={art.wheels[0].r}
        rim={paint.rim}
        chrome={paint.chrome}
      />
      <AlloyWheel
        cx={art.wheels[1].cx}
        cy={art.wheels[1].cy}
        r={art.wheels[1].r}
        rim={paint.rim}
        chrome={paint.chrome}
      />
    </svg>
  );
}

function photoWidth(size: "thumb" | "card" | "hero"): number {
  switch (size) {
    case "thumb":
      return 480;
    case "card":
      return 800;
    case "hero":
      return 1400;
    default: {
      const _exhaustive: never = size;
      return _exhaustive;
    }
  }
}

/** Midnight Garage bay plane — slate/navy with paint-tinted floor wash (no purple). */
function bayAtmosphere(paint: CarPaint, size: "thumb" | "card" | "hero"): string {
  switch (size) {
    case "hero":
      return `
        radial-gradient(ellipse 95% 55% at 50% 108%, ${paint.glow}, transparent 62%),
        radial-gradient(ellipse 70% 40% at 50% -10%, rgba(18, 32, 56, 0.85), transparent 70%),
        linear-gradient(180deg, #101828 0%, #0b1220 42%, #070b14 100%)
      `;
    case "card":
      return `
        radial-gradient(ellipse 90% 58% at 50% 105%, ${paint.glow}, transparent 60%),
        radial-gradient(ellipse 55% 35% at 18% 12%, rgba(163, 230, 53, 0.06), transparent 55%),
        linear-gradient(168deg, #121a2b 0%, #0b1220 48%, #070b14 100%)
      `;
    case "thumb":
      return `
        radial-gradient(ellipse 85% 60% at 50% 110%, ${paint.glow}, transparent 58%),
        linear-gradient(155deg, #121a2b 0%, #0b1220 55%, #070b14 100%)
      `;
    default: {
      const _exhaustive: never = size;
      return _exhaustive;
    }
  }
}

/** White seamless studio behind photoreal renders — soft floor contact, no dark bay wash. */
function whiteStudioAtmosphere(paint: CarPaint, size: "thumb" | "card" | "hero"): string {
  switch (size) {
    case "hero":
      return `
        radial-gradient(ellipse 90% 45% at 50% 100%, ${paint.glow}, transparent 58%),
        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.95), transparent 70%),
        linear-gradient(180deg, #ffffff 0%, #f4f6f8 55%, #e8ecf1 100%)
      `;
    case "card":
      return `
        radial-gradient(ellipse 85% 50% at 50% 105%, ${paint.glow}, transparent 55%),
        linear-gradient(180deg, #ffffff 0%, #f3f5f7 48%, #e7ebf0 100%)
      `;
    case "thumb":
      return `
        radial-gradient(ellipse 80% 55% at 50% 110%, ${paint.glow}, transparent 55%),
        linear-gradient(180deg, #ffffff 0%, #f2f4f7 100%)
      `;
    default: {
      const _exhaustive: never = size;
      return _exhaustive;
    }
  }
}

/** Soft overhead bay rails + floor wash — SVG fallback stays in the lit garage. */
function BayLighting({ paint, size }: { paint: CarPaint; size: "thumb" | "card" | "hero" }) {
  const isHero = size === "hero";
  return (
    <>
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 ${isHero ? "h-16 sm:h-20" : "h-10"} bg-gradient-to-b from-white/[0.07] to-transparent`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute left-[8%] right-[8%] top-0 ${isHero ? "h-[2px]" : "h-px"} bg-gradient-to-r from-transparent via-lime/25 to-transparent`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 ${isHero ? "h-2/5" : "h-1/3"} bg-gradient-to-t from-bay-deep via-bay-deep/70 to-transparent`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute left-1/2 ${isHero ? "bottom-[6%] h-6 w-[72%] sm:h-8" : "bottom-[4%] h-3 w-[70%]"} -translate-x-1/2 rounded-[100%] blur-md`}
        style={{ background: paint.glow }}
        aria-hidden
      />
    </>
  );
}

/** Soft contact shadow under studio photos on the white plane. */
function StudioFloorWash({ paint, size }: { paint: CarPaint; size: "thumb" | "card" | "hero" }) {
  const isHero = size === "hero";
  return (
    <div
      className={`pointer-events-none absolute left-1/2 ${isHero ? "bottom-[5%] h-5 w-[68%] sm:h-7" : "bottom-[3%] h-2.5 w-[65%]"} -translate-x-1/2 rounded-[100%] blur-md`}
      style={{ background: paint.glow }}
      aria-hidden
    />
  );
}

/** Realistic studio photo when make/model known; layered SVG fallback otherwise. */
export function CarVisual({
  colour,
  bodyType,
  make,
  model,
  year,
  fuel,
  size = "thumb",
  title,
  className = "",
}: CarVisualProps) {
  const paint = carPaint(colour);
  const isHero = size === "hero";
  const isCard = size === "card";
  const studioUrl =
    make && model
      ? carStudioImageUrl({
          make,
          model,
          colour,
          bodyType,
          year,
          fuel,
          width: photoWidth(size),
          angle: "23",
        })
      : null;
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(studioUrl) && !photoFailed;

  const frameClass = isHero
    ? `relative overflow-hidden border-y border-white/10 sm:border sm:rounded-md ${className}`
    : isCard
      ? `relative overflow-hidden ${className}`
      : `relative shrink-0 overflow-hidden rounded-md border border-white/10 ${className}`;

  const media = showPhoto ? (
    <img
      src={studioUrl!}
      alt={title ? `${title} in ${colour}` : `${make} ${model}`}
      className={
        isHero
          ? "relative z-[1] h-auto w-full max-w-5xl object-contain object-bottom drop-shadow-[0_18px_36px_rgba(15,23,42,0.28)]"
          : isCard
            ? "relative z-[1] h-full w-full object-contain object-bottom"
            : "relative z-[1] h-full w-full object-contain object-bottom scale-[1.08]"
      }
      loading={isHero ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setPhotoFailed(true)}
    />
  ) : (
    <FallbackSvg colour={colour} bodyType={bodyType} size={size} title={title} />
  );

  const frameAtmosphere = showPhoto
    ? whiteStudioAtmosphere(paint, size)
    : bayAtmosphere(paint, size);

  if (isHero) {
    return (
      <div
        className={frameClass}
        data-bay-frame="hero"
        data-studio-frame={showPhoto ? "white" : "bay"}
        style={{ background: frameAtmosphere }}
        role={title && !showPhoto ? "img" : undefined}
        aria-label={title && !showPhoto ? `${title} in ${colour}` : undefined}
      >
        <span
          className="absolute inset-y-0 left-0 z-[2] w-1.5 sm:w-2.5"
          style={{ backgroundColor: paint.base }}
          aria-hidden
        />
        <span
          className="absolute inset-y-0 right-0 z-[2] w-px bg-gradient-to-b from-transparent via-rose/30 to-transparent sm:w-[2px]"
          aria-hidden
        />
        {showPhoto ? <StudioFloorWash paint={paint} size="hero" /> : <BayLighting paint={paint} size="hero" />}
        <div className="relative flex min-h-[16rem] items-end justify-center px-1 pb-0 pt-8 sm:min-h-[22rem] sm:px-3 sm:pt-12 lg:min-h-[26rem]">
          {media}
        </div>
      </div>
    );
  }

  if (isCard) {
    return (
      <div
        className={frameClass}
        data-bay-frame="card"
        data-studio-frame={showPhoto ? "white" : "bay"}
        style={{ background: frameAtmosphere }}
        aria-hidden={showPhoto ? undefined : true}
      >
        {showPhoto ? <StudioFloorWash paint={paint} size="card" /> : <BayLighting paint={paint} size="card" />}
        <div className="absolute inset-0 flex items-end justify-center px-1 pb-0 pt-2">{media}</div>
      </div>
    );
  }

  return (
    <div
      className={frameClass}
      data-bay-frame="thumb"
      data-studio-frame={showPhoto ? "white" : "bay"}
      style={{ background: frameAtmosphere }}
      aria-hidden={showPhoto ? undefined : true}
    >
      <span
        className="absolute inset-y-0 left-0 z-[2] w-1.5"
        style={{ backgroundColor: paint.base }}
        aria-hidden
      />
      {showPhoto ? <StudioFloorWash paint={paint} size="thumb" /> : <BayLighting paint={paint} size="thumb" />}
      <div className="absolute inset-0 flex items-end justify-center p-0.5">{media}</div>
    </div>
  );
}
