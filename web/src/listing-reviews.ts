/** Deep-link into Video reviews Find for this listing’s make/model. */

export function listingReviewsQuery(make: string, model: string): string {
  return [make, model].map((part) => part.trim()).filter(Boolean).join(" ");
}

export function listingReviewsHref(make: string, model: string): string {
  const q = listingReviewsQuery(make, model);
  if (!q) return "/reviews";
  const params = new URLSearchParams({ q });
  return `/reviews?${params.toString()}`;
}
