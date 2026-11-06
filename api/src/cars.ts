export type ListingSummary = {
  id: number;
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  fuel: string;
  drivetrain: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
  conditionType: "new" | "used";
  year: number;
  colour: string;
  mileage: number;
  coinPrice: number;
  ownerLabel: string;
  garageName: string;
  garageCity: string;
};

export type ListingDetail = ListingSummary & {
  doors: number;
  seats: number;
  garageTagline: string;
  status: "available" | "sold";
};

export type CarFilters = {
  makes: string[];
  models: string[];
  bodyTypes: string[];
  fuels: string[];
  colours: string[];
  conditions: Array<"new" | "used">;
  yearMin: number;
  yearMax: number;
  coinPriceMin: number;
  coinPriceMax: number;
};

export type SearchParams = {
  q?: string;
  make?: string;
  model?: string;
  bodyType?: string;
  fuel?: string;
  colour?: string;
  condition?: "new" | "used";
  yearMin?: number;
  yearMax?: number;
  coinMin?: number;
  coinMax?: number;
  mileageMax?: number;
  bhpMin?: number;
  sort?: "price_asc" | "price_desc" | "year_desc" | "mileage_asc" | "bhp_desc";
  limit?: number;
  offset?: number;
};

export function listingSelectSql(): string {
  return `
    SELECT
      l.id,
      cm.make,
      cm.model,
      cm.trim_name AS trimName,
      cm.body_type AS bodyType,
      cm.fuel,
      cm.drivetrain,
      cm.doors,
      cm.seats,
      cm.bhp,
      cm.top_speed_mph AS topSpeedMph,
      cm.zero_to_sixty_secs AS zeroToSixtySecs,
      l.condition_type AS conditionType,
      l.year,
      l.colour,
      l.mileage,
      l.coin_price AS coinPrice,
      l.owner_label AS ownerLabel,
      l.status,
      g.name AS garageName,
      g.city AS garageCity,
      g.tagline AS garageTagline
    FROM listings l
    INNER JOIN car_models cm ON cm.id = l.car_model_id
    INNER JOIN garages g ON g.id = l.garage_id
  `;
}

export function buildSearchClause(params: SearchParams): {
  whereSql: string;
  values: unknown[];
  orderSql: string;
} {
  const clauses: string[] = ["l.status = 'available'"];
  const values: unknown[] = [];

  if (params.q) {
    clauses.push("(cm.make LIKE ? OR cm.model LIKE ? OR cm.trim_name LIKE ? OR g.name LIKE ?)");
    const like = `%${params.q}%`;
    values.push(like, like, like, like);
  }
  if (params.make) {
    clauses.push("cm.make = ?");
    values.push(params.make);
  }
  if (params.model) {
    clauses.push("cm.model = ?");
    values.push(params.model);
  }
  if (params.bodyType) {
    clauses.push("cm.body_type = ?");
    values.push(params.bodyType);
  }
  if (params.fuel) {
    clauses.push("cm.fuel = ?");
    values.push(params.fuel);
  }
  if (params.colour) {
    clauses.push("l.colour = ?");
    values.push(params.colour);
  }
  if (params.condition) {
    clauses.push("l.condition_type = ?");
    values.push(params.condition);
  }
  if (params.yearMin != null) {
    clauses.push("l.year >= ?");
    values.push(params.yearMin);
  }
  if (params.yearMax != null) {
    clauses.push("l.year <= ?");
    values.push(params.yearMax);
  }
  if (params.coinMin != null) {
    clauses.push("l.coin_price >= ?");
    values.push(params.coinMin);
  }
  if (params.coinMax != null) {
    clauses.push("l.coin_price <= ?");
    values.push(params.coinMax);
  }
  if (params.mileageMax != null) {
    clauses.push("l.mileage <= ?");
    values.push(params.mileageMax);
  }
  if (params.bhpMin != null) {
    clauses.push("cm.bhp >= ?");
    values.push(params.bhpMin);
  }

  let orderSql = "ORDER BY l.coin_price ASC, l.id ASC";
  switch (params.sort) {
    case "price_asc":
      orderSql = "ORDER BY l.coin_price ASC, l.id ASC";
      break;
    case "price_desc":
      orderSql = "ORDER BY l.coin_price DESC, l.id ASC";
      break;
    case "year_desc":
      orderSql = "ORDER BY l.year DESC, l.id ASC";
      break;
    case "mileage_asc":
      orderSql = "ORDER BY l.mileage ASC, l.id ASC";
      break;
    case "bhp_desc":
      orderSql = "ORDER BY cm.bhp DESC, l.id ASC";
      break;
    case undefined:
      break;
    default: {
      const _exhaustive: never = params.sort;
      void _exhaustive;
      break;
    }
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
    orderSql,
  };
}

export function toListingSummary(row: Record<string, unknown>): ListingSummary {
  return {
    id: Number(row.id),
    make: String(row.make),
    model: String(row.model),
    trimName: String(row.trimName),
    bodyType: String(row.bodyType),
    fuel: String(row.fuel),
    drivetrain: String(row.drivetrain),
    bhp: Number(row.bhp),
    topSpeedMph: Number(row.topSpeedMph),
    zeroToSixtySecs: Number(row.zeroToSixtySecs),
    conditionType: row.conditionType as "new" | "used",
    year: Number(row.year),
    colour: String(row.colour),
    mileage: Number(row.mileage),
    coinPrice: Number(row.coinPrice),
    ownerLabel: String(row.ownerLabel),
    garageName: String(row.garageName),
    garageCity: String(row.garageCity),
  };
}

export function toListingDetail(row: Record<string, unknown>): ListingDetail {
  return {
    ...toListingSummary(row),
    doors: Number(row.doors),
    seats: Number(row.seats),
    garageTagline: String(row.garageTagline),
    status: row.status as "available" | "sold",
  };
}
