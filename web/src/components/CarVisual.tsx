import { useId, useState } from "react";
import { carStudioImageUrl } from "../car-image";
import { carBodyArt, carPaint } from "../car-visuals";

type CarVisualProps = {
  colour: string;
  bodyType?: string;
  make?: string;
  model?: string;
  /** Thumbnail strip vs listing hero. */
  size?: "thumb" | "hero";
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
  size: "thumb" | "hero";
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const paint = carPaint(colour);
  const art = carBodyArt(bodyType);
  const isHero = size === "hero";
  const bodyGrad = `paint-${uid}`;
  const glassGrad = `glass-${uid}`;
  const bayGrad = `bay-${uid}`;
  const shineGrad = `shine-${uid}`;
  const floorGrad = `floor-${uid}`;

  return (
    <svg
      viewBox="0 0 200 120"
      className={isHero ? "h-32 w-full max-w-2xl sm:h-44" : "h-full w-full"}
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

/** Realistic studio photo when make/model known; layered SVG fallback otherwise. */
export function CarVisual({
  colour,
  bodyType,
  make,
  model,
  size = "thumb",
  title,
  className = "",
}: CarVisualProps) {
  const paint = carPaint(colour);
  const isHero = size === "hero";
  const studioUrl =
    make && model
      ? carStudioImageUrl({
          make,
          model,
          colour,
          width: isHero ? 900 : 420,
          angle: "23",
        })
      : null;
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(studioUrl) && !photoFailed;

  const frameClass = isHero
    ? `relative mt-6 overflow-hidden rounded-md border border-white/10 ${className}`
    : `relative shrink-0 overflow-hidden rounded-md border border-white/10 ${className}`;

  const media = showPhoto ? (
    <img
      src={studioUrl!}
      alt={title ? `${title} in ${colour}` : `${make} ${model}`}
      className={
        isHero
          ? "h-auto w-full max-w-3xl object-contain object-bottom"
          : "h-full w-full object-contain object-center"
      }
      loading={isHero ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setPhotoFailed(true)}
    />
  ) : (
    <FallbackSvg colour={colour} bodyType={bodyType} size={size} title={title} />
  );

  if (isHero) {
    return (
      <div
        className={frameClass}
        style={{
          background: `linear-gradient(120deg, ${paint.glow}, transparent 55%), #070b14`,
        }}
        role={title && !showPhoto ? "img" : undefined}
        aria-label={title && !showPhoto ? `${title} in ${colour}` : undefined}
      >
        <span
          className="absolute inset-y-0 left-0 w-2 sm:w-3"
          style={{ backgroundColor: paint.base }}
          aria-hidden
        />
        <div className="flex min-h-[10rem] items-end justify-center px-3 pb-2 pt-5 sm:min-h-[14rem] sm:px-6">
          {media}
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
      aria-hidden={showPhoto ? undefined : true}
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: paint.base }}
      />
      <div className="absolute inset-0 flex items-end justify-center p-1">{media}</div>
    </div>
  );
}
