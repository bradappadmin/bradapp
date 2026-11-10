/** Live countdown helpers for the Top Trumps weekly cup (`weekEnd` exclusive). */

export function remainingMsUntil(isoEnd: string, nowMs = Date.now()): number {
  const end = Date.parse(isoEnd);
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, end - nowMs);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Compact remaining span with fixed digit width to limit layout flicker. */
export function formatCupCountdown(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3_600);
  const mins = Math.floor((totalSec % 3_600) / 60);
  const secs = totalSec % 60;
  if (days > 0) {
    return `${days}d ${pad2(hours)}h ${pad2(mins)}m ${pad2(secs)}s`;
  }
  if (hours > 0) {
    return `${hours}h ${pad2(mins)}m ${pad2(secs)}s`;
  }
  if (mins > 0) {
    return `${mins}m ${pad2(secs)}s`;
  }
  return `${secs}s`;
}

export function cupCountdownLabel(isoEnd: string, nowMs = Date.now()): string {
  const remaining = remainingMsUntil(isoEnd, nowMs);
  if (remaining <= 0) {
    return "Week ended · next cup starting";
  }
  return `Ends in ${formatCupCountdown(remaining)}`;
}
