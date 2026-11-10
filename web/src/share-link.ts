/** Absolute share URLs for listings, compare, reviews, and public garages on this origin. */

export function listingSharePath(listingId: number): string {
  return `/cars/${listingId}`;
}

export function compareSharePath(leftId: number, rightId: number): string {
  return `/compare?a=${leftId}&b=${rightId}`;
}

/** Published review detail path (`/reviews/:id`). */
export function reviewSharePath(reviewId: number): string {
  return `/reviews/${reviewId}`;
}

/** Public member profile path (`/members/:id`). */
export function memberProfileSharePath(memberUserId: number): string {
  return `/members/${memberUserId}`;
}

/** Public member garage path — same URL as the profile (`/members/:id`). */
export function garageSharePath(memberUserId: number): string {
  return memberProfileSharePath(memberUserId);
}

/** Signup path with a family invite code prefilled (`/signup?invite=`). */
export function inviteSignupPath(inviteCode: string): string {
  const code = inviteCode.trim();
  if (!code) return "/signup";
  return `/signup?invite=${encodeURIComponent(code)}`;
}

export function absoluteShareUrl(
  path: string,
  origin: string = typeof window !== "undefined" ? window.location.origin : "",
): string {
  if (!origin) return path;
  const base = origin.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export async function copyTextToClipboard(
  text: string,
  clipboard: Pick<Clipboard, "writeText"> | null = typeof navigator !== "undefined"
    ? navigator.clipboard
    : null,
): Promise<boolean> {
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // fall through to execCommand fallback
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
