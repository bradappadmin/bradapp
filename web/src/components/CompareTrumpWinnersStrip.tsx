import type { CompareHighlight, CompareRow } from "../compare-specs";

type CompareTrumpWinnersStripProps = {
  rows: CompareRow[];
  leftTitle: string;
  rightTitle: string;
};

function sideTone(side: "left" | "right", highlight: CompareHighlight): string {
  if (highlight === side) {
    return "border-lime/45 bg-lime/10 text-lime";
  }
  if (highlight === "tie") {
    return "border-white/10 bg-bay-deep/50 text-mist";
  }
  return "border-white/10 bg-bay-deep/40 text-mist";
}

function sideLabel(side: "left" | "right", highlight: CompareHighlight): string | null {
  if (highlight === side) return "Wins";
  if (highlight === "tie") return "Tie";
  return null;
}

/**
 * Clear Top Trumps winners under compare studio heroes.
 * Same Play rules: higher Power / Top speed win; lower 0–60 wins; ties stay neutral.
 */
export function CompareTrumpWinnersStrip({
  rows,
  leftTitle,
  rightTitle,
}: CompareTrumpWinnersStripProps) {
  if (rows.length === 0) return null;

  return (
    <section
      className="play-panel bay-rise-delay mt-6 overflow-hidden rounded-md border sm:mt-8"
      aria-label="Top Trumps winners"
    >
      <div className="border-b border-white/8 px-4 py-3 sm:px-5 sm:py-3.5">
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Top Trumps · Play rules</p>
        <h2 className="mt-1 font-display text-lg text-mist sm:text-xl">Category winners</h2>
        <p className="mt-1 text-sm text-steel">
          Higher Power and Top speed win; lower 0–60 wins. Ties stay neutral — same as Play.
        </p>
      </div>
      <ul className="divide-y divide-white/8 p-0">
        {rows.map((row) => {
          const leftMark = sideLabel("left", row.highlight);
          const rightMark = sideLabel("right", row.highlight);
          return (
            <li
              key={row.id}
              className="grid gap-3 px-4 py-3 sm:grid-cols-[7.5rem_1fr_auto_1fr] sm:items-center sm:gap-4 sm:px-5 sm:py-3.5"
            >
              <p className="font-display text-sm font-semibold text-mist">{row.label}</p>
              <div
                className={`rounded-md border px-3 py-2 ${sideTone("left", row.highlight)}`}
                aria-label={`${row.label} ${leftTitle}${leftMark ? ` · ${leftMark}` : ""}`}
              >
                <p className="text-[10px] uppercase tracking-wide text-steel sm:sr-only">
                  {leftTitle}
                </p>
                <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-2 sm:mt-0">
                  <span className="font-display text-base font-semibold sm:text-lg">{row.left}</span>
                  {leftMark ? (
                    <span className="font-display text-[10px] font-semibold uppercase tracking-wide">
                      {leftMark}
                    </span>
                  ) : null}
                </div>
              </div>
              <p
                className="hidden text-center font-display text-xs uppercase tracking-[0.18em] text-steel sm:block"
                aria-hidden
              >
                vs
              </p>
              <div
                className={`rounded-md border px-3 py-2 ${sideTone("right", row.highlight)}`}
                aria-label={`${row.label} ${rightTitle}${rightMark ? ` · ${rightMark}` : ""}`}
              >
                <p className="text-[10px] uppercase tracking-wide text-steel sm:sr-only">
                  {rightTitle}
                </p>
                <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-2 sm:mt-0">
                  <span className="font-display text-base font-semibold sm:text-lg">{row.right}</span>
                  {rightMark ? (
                    <span className="font-display text-[10px] font-semibold uppercase tracking-wide">
                      {rightMark}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
