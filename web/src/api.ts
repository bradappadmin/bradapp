import type { CarFilters, ListingDetail, ListingSummary, SearchQuery } from "./cars";
import type { User } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

type ApiErrorBody = {
  error?: string;
  message?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const err = (body ?? {}) as ApiErrorBody;
    throw new Error(err.message ?? "Request failed");
  }

  return body as T;
}

export function signUp(input: {
  email: string;
  password: string;
  displayName: string;
  inviteCode?: string;
}): Promise<{ user: User }> {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchSignupOptions(): Promise<{ requireInviteCode: boolean }> {
  return request("/auth/signup-options");
}

export type DailyLoginStatus = {
  amount: number;
  claimDate: string;
  claimedToday: boolean;
  claimedJustNow: boolean;
  balance: number;
};

export function signIn(input: {
  email: string;
  password: string;
}): Promise<{ user: User; dailyLogin?: DailyLoginStatus }> {
  return request("/auth/signin", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function signOut(): Promise<{ ok: boolean }> {
  return request("/auth/signout", { method: "POST" });
}

export function fetchMe(): Promise<{ user: User; dailyLogin: DailyLoginStatus }> {
  return request("/auth/me");
}

export function fetchDailyBonus(): Promise<{ dailyLogin: DailyLoginStatus }> {
  return request("/auth/daily-bonus");
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ ok: boolean }> {
  return request("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export const BIO_MAX_LENGTH = 160;

export function updateProfile(input: {
  displayName: string;
  bio?: string;
}): Promise<{ user: User }> {
  return request("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export type ActivityKind = "purchase" | "sale" | "trade" | "top_trumps" | "review";

/** Primary car on a family activity row (studio photo / SVG fallback). */
export type ActivityCarVisual = {
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
};

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  createdAt: string;
  summary: string;
  /** Member display name for the primary actor. */
  actorName: string;
  href: string | null;
  car: ActivityCarVisual | null;
};

export function fetchActivity(limit = 30): Promise<{ items: ActivityItem[] }> {
  return request(`/activity?limit=${limit}`);
}

/** Highest-value owned/available listing; ties → lowest listing id. */
export type LeaderboardHighlightCar = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
  coinPrice: number;
};

export type LeaderboardEntry = {
  rank: number;
  id: number;
  displayName: string;
  bio: string | null;
  role: "super_admin" | "admin" | "member";
  roleLabel: string;
  coinBalance: number;
  topTrumpsWins: number;
  highlightCar: LeaderboardHighlightCar | null;
};

export function fetchLeaderboard(): Promise<{ entries: LeaderboardEntry[] }> {
  return request("/leaderboard");
}

export function claimDailyBonus(): Promise<{
  dailyLogin: DailyLoginStatus;
  user: User;
}> {
  return request("/auth/daily-bonus", { method: "POST" });
}

function toQuery(params: SearchQuery): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function fetchCarFilters(): Promise<{ filters: CarFilters }> {
  return request("/cars/filters");
}

export function searchCars(
  params: SearchQuery,
): Promise<{ total: number; limit: number; offset: number; listings: ListingSummary[] }> {
  return request(`/cars/search${toQuery(params)}`);
}

export function fetchListing(id: number): Promise<{ listing: ListingDetail; favourited: boolean }> {
  return request(`/cars/listings/${id}`);
}

export type FavouriteCar = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
  conditionType: "new" | "used";
  year: number;
  colour: string;
  mileage: number;
  coinPrice: number;
  status: "available" | "owned" | "sold";
  ownerLabel: string;
  garageName: string;
  garageCity: string;
  favouritedAt: string;
};

export function fetchFavourites(): Promise<{ cars: FavouriteCar[] }> {
  return request("/favourites");
}

export function fetchFavouriteStatus(id: number): Promise<{ favourited: boolean }> {
  return request(`/favourites/${id}`);
}

export function saveFavourite(id: number): Promise<{ ok: boolean; favourited: true }> {
  return request(`/favourites/${id}`, { method: "POST" });
}

export function removeFavourite(id: number): Promise<{ ok: boolean; favourited: false }> {
  return request(`/favourites/${id}`, { method: "DELETE" });
}

export function fetchModels(make?: string): Promise<{ models: string[] }> {
  return request(`/cars/models${toQuery({ make: make ?? "" })}`);
}

export type LedgerEntry = {
  id: number;
  delta: number;
  balanceAfter: number;
  reason:
    | "seed"
    | "purchase"
    | "sale"
    | "admin_adjust"
    | "play_reward"
    | "daily_login"
    | "tt_streak_bonus";
  listingId: number | null;
  note: string;
  createdAt: string;
};

export type GarageCar = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
  conditionType: "new" | "used";
  year: number;
  colour: string;
  mileage: number;
  coinPrice: number;
  status: "available" | "owned" | "sold";
  ownerLabel: string;
  garageName: string;
  garageCity: string;
};

export function fetchWallet(): Promise<{ balance: number; ledger: LedgerEntry[] }> {
  return request("/trade/wallet");
}

export function fetchLedger(
  limit = 100,
): Promise<{ balance: number; ledger: LedgerEntry[] }> {
  const qs = new URLSearchParams({ limit: String(limit) }).toString();
  return request(`/trade/ledger?${qs}`);
}

export function fetchGarage(): Promise<{
  cars: GarageCar[];
  totalValue: number;
  showcaseListingId: number | null;
}> {
  return request("/trade/garage");
}

/** Pin or unpin the public garage showcase car. Pass null to unpin. */
export function setGarageShowcase(
  listingId: number | null,
): Promise<{ ok: boolean; showcaseListingId: number | null }> {
  return request("/trade/garage/showcase", {
    method: "PUT",
    body: JSON.stringify({ listingId }),
  });
}

export type SoldCar = {
  ledgerId: number;
  listingId: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
  year: number;
  soldPrice: number;
  soldAt: string;
  buyerDisplayName: string | null;
};

export function fetchSoldHistory(): Promise<{ sales: SoldCar[] }> {
  return request("/trade/sold");
}

export type PurchasedCar = {
  ledgerId: number;
  listingId: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
  year: number;
  paidPrice: number;
  purchasedAt: string;
  sellerDisplayName: string | null;
};

export function fetchPurchaseHistory(): Promise<{ purchases: PurchasedCar[] }> {
  return request("/trade/purchases");
}

export function buyListing(id: number): Promise<{ ok: boolean; listingId: number; coinPrice: number; balance: number }> {
  return request(`/trade/listings/${id}/buy`, { method: "POST" });
}

export function sellListing(
  id: number,
  coinPrice: number,
): Promise<{ ok: boolean; listingId: number; coinPrice: number; status: "available" }> {
  return request(`/trade/listings/${id}/sell`, {
    method: "POST",
    body: JSON.stringify({ coinPrice }),
  });
}

export function unlistListing(id: number): Promise<{ ok: boolean; listingId: number; status: "owned" }> {
  return request(`/trade/listings/${id}/unlist`, { method: "POST" });
}

export type TopTrumpsCategory = "bhp" | "top_speed_mph" | "zero_to_sixty_secs";

export type MemberCard = {
  id: number;
  ownerUserId: number;
  ownerDisplayName: string;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
  year: number;
  colour: string;
};

export type TradeRow = {
  id: number;
  status: "pending" | "accepted" | "declined" | "cancelled";
  fromUserId: number;
  toUserId: number;
  offerListingId: number;
  requestListingId: number;
  fromDisplayName: string;
  toDisplayName: string;
  offerMake: string;
  offerModel: string;
  offerTrimName: string;
  offerBodyType: string;
  offerColour: string;
  offerYear: number;
  requestMake: string;
  requestModel: string;
  requestTrimName: string;
  requestBodyType: string;
  requestColour: string;
  requestYear: number;
  createdAt: string;
};

export type StreakMilestone = { streak: number; coins: number };

export function fetchTopTrumpsCategories(): Promise<{
  categories: Array<{ id: TopTrumpsCategory; label: string; direction: "higher" | "lower" }>;
  rewards: { win: number; play: number };
  streakMilestones?: StreakMilestone[];
}> {
  return request("/play/top-trumps/categories");
}

export function fetchTopTrumpsStreak(): Promise<{
  streak: number;
  milestones: StreakMilestone[];
}> {
  return request("/play/top-trumps/streak");
}

export type WinStreakResult = {
  current: number;
  bonusAwarded: number;
};

export type MatchHistoryCar = {
  listingId: number | null;
  make: string;
  model: string;
  trimName: string;
  value: number;
};

export type MatchHistoryItem = {
  id: number;
  mode: "house" | "pvp";
  category: TopTrumpsCategory;
  createdAt: string;
  opponentName: string;
  yourCar: MatchHistoryCar;
  theirCar: MatchHistoryCar;
  result: "win" | "loss" | "draw";
  coinReward: number;
  youWere: "challenger" | "opponent";
};

export function fetchTopTrumpsHistory(
  limit = 40,
): Promise<{ matches: MatchHistoryItem[] }> {
  const qs = new URLSearchParams({ limit: String(limit) }).toString();
  return request(`/play/top-trumps/history?${qs}`);
}

export type TopTrumpsCardVisual = {
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
  year: number | null;
};

export function playTopTrumpsHouse(input: {
  listingId: number;
  category: TopTrumpsCategory;
}): Promise<{
  match: {
    id: number;
    winner: "challenger" | "opponent" | "draw";
    coinReward: number;
    challengerValue: number;
    opponentValue: number;
    category: TopTrumpsCategory;
    challenger: TopTrumpsCardVisual;
    opponent: TopTrumpsCardVisual;
  };
  balance: number;
  winStreak: WinStreakResult;
}> {
  return request("/play/top-trumps/house", { method: "POST", body: JSON.stringify(input) });
}

export function playTopTrumpsPvp(input: {
  listingId: number;
  opponentListingId: number;
  category: TopTrumpsCategory;
}): Promise<{
  match: {
    id: number;
    winner: "challenger" | "opponent" | "draw";
    coinReward: number;
    challengerValue: number;
    opponentValue: number;
    category: TopTrumpsCategory;
    challenger: TopTrumpsCardVisual;
    opponent: TopTrumpsCardVisual & { userId: number };
  };
  balance: number;
  winStreak: WinStreakResult;
}> {
  return request("/play/top-trumps/pvp", { method: "POST", body: JSON.stringify(input) });
}

export function fetchMemberCards(ownerUserId?: number): Promise<{ cards: MemberCard[] }> {
  const qs =
    ownerUserId != null && Number.isFinite(ownerUserId) ? `?ownerUserId=${ownerUserId}` : "";
  return request(`/play/cards/members${qs}`);
}

export type MemberSummary = {
  id: number;
  displayName: string;
  bio: string | null;
  role: "super_admin" | "admin" | "member";
  roleLabel: string;
  coinBalance: number;
  carCount: number;
};

export type MemberProfileCar = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
  year: number;
  colour: string;
  status: string;
  coinPrice: number;
};

export function fetchMembers(params?: {
  q?: string;
}): Promise<{ members: MemberSummary[]; q?: string | null }> {
  const q = params?.q?.trim();
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return request(`/members${query}`);
}

export type ShowcaseSource = "pinned" | "highest_value";

export function fetchMemberProfile(id: number): Promise<{
  member: MemberSummary;
  cars: MemberProfileCar[];
  showcase: MemberProfileCar | null;
  showcaseSource: ShowcaseSource | null;
  showcaseListingId: number | null;
}> {
  return request(`/members/${id}`);
}

export function fetchTrades(): Promise<{ trades: TradeRow[] }> {
  return request("/play/trades");
}

export type CompletedTradeCar = {
  listingId: number;
  make: string;
  model: string;
  trimName: string;
};

export type CompletedTrade = {
  id: number;
  resolvedAt: string;
  counterpartyName: string;
  youGave: CompletedTradeCar;
  youGot: CompletedTradeCar;
  youWere: "offerer" | "receiver";
};

export function fetchCompletedTrades(
  limit = 40,
): Promise<{ trades: CompletedTrade[] }> {
  const qs = new URLSearchParams({ limit: String(limit) }).toString();
  return request(`/play/trades/history?${qs}`);
}

export function fetchTradeInboxCount(): Promise<{ pendingIncoming: number }> {
  return request("/play/trades/inbox-count");
}

export function createTrade(input: {
  offerListingId: number;
  requestListingId: number;
}): Promise<{ trade: { id: number; status: string } }> {
  return request("/play/trades", { method: "POST", body: JSON.stringify(input) });
}

export function acceptTrade(id: number): Promise<{ ok: boolean }> {
  return request(`/play/trades/${id}/accept`, { method: "POST" });
}

export function declineTrade(id: number): Promise<{ ok: boolean }> {
  return request(`/play/trades/${id}/decline`, { method: "POST" });
}

export function cancelTrade(id: number): Promise<{ ok: boolean }> {
  return request(`/play/trades/${id}/cancel`, { method: "POST" });
}

export type CueCard = { id: string; title: string; prompt: string };

export type ReviewType = "review" | "drag_race";

export type ReviewCar = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
};

export type ReviewSummary = {
  id: number;
  type: ReviewType;
  title: string;
  status: "published" | "unpublished";
  createdAt: string;
  publisher: { id: number; displayName: string };
  car: ReviewCar;
  /** Present when type is drag_race. */
  carB: ReviewCar | null;
  cueCards: CueCard[];
  videoUrl: string;
  mimeType: string;
  likeCount: number;
  likedByMe: boolean;
  featured: boolean;
};

export type ReviewCarModel = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  colour: string;
  label: string;
};

export function fetchReviews(
  all = false,
  limit?: number,
  type?: ReviewType | "all",
): Promise<{ reviews: ReviewSummary[] }> {
  const params = new URLSearchParams();
  if (all) params.set("all", "1");
  if (limit != null && Number.isFinite(limit)) params.set("limit", String(limit));
  if (type === "review" || type === "drag_race") params.set("type", type);
  const qs = params.toString();
  return request(`/reviews${qs ? `?${qs}` : ""}`);
}

export function fetchReview(id: number): Promise<{ review: ReviewSummary }> {
  return request(`/reviews/${id}`);
}

export function fetchReviewModels(): Promise<{ models: ReviewCarModel[] }> {
  return request("/reviews/models");
}

export function fetchCueCards(
  carModelId: number,
  carModelBId?: number,
): Promise<{
  type: ReviewType;
  car: { id: number; make: string; model: string; trimName: string };
  carB: { id: number; make: string; model: string; trimName: string } | null;
  cueCards: CueCard[];
}> {
  const qs =
    carModelBId != null && Number.isFinite(carModelBId)
      ? `?vs=${encodeURIComponent(String(carModelBId))}`
      : "";
  return request(`/reviews/cues/${carModelId}${qs}`);
}

export async function publishReview(input: {
  type?: ReviewType;
  carModelId: number;
  carModelBId?: number;
  title: string;
  video: Blob;
  filename?: string;
}): Promise<{ review: ReviewSummary }> {
  const body = new FormData();
  body.append("type", input.type ?? "review");
  body.append("carModelId", String(input.carModelId));
  if (input.type === "drag_race" && input.carModelBId != null) {
    body.append("carModelBId", String(input.carModelBId));
  }
  body.append("title", input.title);
  body.append("video", input.video, input.filename ?? "review.webm");
  const response = await fetch(`${API_BASE}/reviews`, {
    method: "POST",
    credentials: "include",
    body,
  });
  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as { review?: ReviewSummary; message?: string }) : {};
  if (!response.ok) {
    throw new Error(parsed.message ?? "Publish failed");
  }
  return parsed as { review: ReviewSummary };
}

export function unpublishReview(id: number): Promise<{ ok: boolean; status: string }> {
  return request(`/reviews/${id}/unpublish`, { method: "POST" });
}

export function likeReview(id: number): Promise<{ ok: boolean; liked: true; likeCount: number }> {
  return request(`/reviews/${id}/like`, { method: "POST" });
}

export function unlikeReview(id: number): Promise<{ ok: boolean; liked: false; likeCount: number }> {
  return request(`/reviews/${id}/like`, { method: "DELETE" });
}

export function fetchFeaturedReview(): Promise<{ review: ReviewSummary | null }> {
  return request("/reviews/featured");
}

export function featureReview(id: number): Promise<{ ok: boolean; review: ReviewSummary }> {
  return request(`/reviews/${id}/feature`, { method: "POST" });
}

export function unfeatureReview(id: number): Promise<{ ok: boolean; review: ReviewSummary | null }> {
  return request(`/reviews/${id}/feature`, { method: "DELETE" });
}

export function reviewVideoSrc(videoUrl: string): string {
  return `${API_BASE}${videoUrl}`;
}

export type AdminUser = {
  id: number;
  email: string;
  displayName: string;
  role: "super_admin" | "admin" | "member";
  coinBalance: number;
  accountStatus: "active" | "closed" | "frozen";
  createdAt?: string;
};

export type AdminGarage = { id: number; name: string; city: string; tagline: string };

export type AdminCarModel = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  fuel: string;
  drivetrain: string;
  doors: number;
  seats: number;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
};

export type AdminListing = {
  id: number;
  conditionType: "new" | "used";
  year: number;
  colour: string;
  mileage: number;
  coinPrice: number;
  ownerLabel: string;
  status: "available" | "owned" | "sold";
  garageId: number;
  make: string;
  model: string;
  trimName: string;
  garageName: string;
};

export function fetchAdminUsers(): Promise<{ users: AdminUser[] }> {
  return request("/admin/users");
}

export function patchAdminUser(
  id: number,
  body: {
    displayName?: string;
    role?: AdminUser["role"];
    accountStatus?: AdminUser["accountStatus"];
  },
): Promise<{ user: AdminUser }> {
  return request(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function adjustAdminCoins(
  id: number,
  body: { delta: number; note?: string },
): Promise<{ balance: number; ledger: LedgerEntry[] }> {
  return request(`/admin/users/${id}/coins`, { method: "POST", body: JSON.stringify(body) });
}

export type AdminCoinAdjustment = {
  id: number;
  userId: number;
  userDisplayName: string;
  userEmail: string;
  delta: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
  createdByUserId: number | null;
  createdByDisplayName: string | null;
};

export function fetchAdminCoinAdjustments(
  limit = 50,
): Promise<{ adjustments: AdminCoinAdjustment[] }> {
  return request(`/admin/coin-adjustments?limit=${limit}`);
}

export function fetchAdminGarages(): Promise<{ garages: AdminGarage[] }> {
  return request("/admin/garages");
}

export function patchAdminGarage(
  id: number,
  body: Partial<Pick<AdminGarage, "name" | "city" | "tagline">>,
): Promise<{ garage: AdminGarage }> {
  return request(`/admin/garages/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function fetchAdminCarModels(): Promise<{ models: AdminCarModel[] }> {
  return request("/admin/car-models");
}

export function patchAdminCarModel(
  id: number,
  body: Partial<AdminCarModel>,
): Promise<{ model: AdminCarModel }> {
  return request(`/admin/car-models/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function fetchAdminListings(): Promise<{ listings: AdminListing[] }> {
  return request("/admin/listings");
}

export function patchAdminListing(
  id: number,
  body: Partial<{
    conditionType: "new" | "used";
    year: number;
    colour: string;
    mileage: number;
    coinPrice: number;
    ownerLabel: string;
    status: "available" | "owned" | "sold";
    garageId: number;
  }>,
): Promise<{ listing: AdminListing }> {
  return request(`/admin/listings/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export type FamilyInvite = {
  id: number;
  code: string;
  createdByUserId: number;
  createdByDisplayName: string | null;
  createdAt: string;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
};

export function fetchAdminInvites(): Promise<{
  invites: FamilyInvite[];
  requireInviteCode: boolean;
}> {
  return request("/admin/invites");
}

export function setAdminRequireInvite(
  requireInviteCode: boolean,
): Promise<{ requireInviteCode: boolean }> {
  return request("/admin/invites/require", {
    method: "PUT",
    body: JSON.stringify({ requireInviteCode }),
  });
}

export function createAdminInvite(body: {
  code?: string;
  maxUses?: number | null;
  expiresAt?: string | null;
}): Promise<{ invite: FamilyInvite }> {
  return request("/admin/invites", { method: "POST", body: JSON.stringify(body) });
}

export function revokeAdminInvite(id: number): Promise<{ invite: FamilyInvite }> {
  return request(`/admin/invites/${id}/revoke`, { method: "POST" });
}
