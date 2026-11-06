import { getPool, type RowDataPacket } from "./db.js";
import {
  SEED_CAR_MODELS,
  SEED_GARAGES,
  buildSeedListings,
} from "./car-seed-data.js";

export async function seedCars(): Promise<void> {
  const pool = getPool();

  for (const car of SEED_CAR_MODELS) {
    await pool.query(
      `INSERT INTO car_models
        (make, model, trim_name, body_type, fuel, drivetrain, doors, seats, bhp, top_speed_mph, zero_to_sixty_secs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         body_type = VALUES(body_type),
         fuel = VALUES(fuel),
         drivetrain = VALUES(drivetrain),
         doors = VALUES(doors),
         seats = VALUES(seats),
         bhp = VALUES(bhp),
         top_speed_mph = VALUES(top_speed_mph),
         zero_to_sixty_secs = VALUES(zero_to_sixty_secs)`,
      [
        car.make,
        car.model,
        car.trimName,
        car.bodyType,
        car.fuel,
        car.drivetrain,
        car.doors,
        car.seats,
        car.bhp,
        car.topSpeedMph,
        car.zeroToSixtySecs,
      ],
    );
  }

  for (const garage of SEED_GARAGES) {
    await pool.query(
      `INSERT INTO garages (name, city, tagline)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         city = VALUES(city),
         tagline = VALUES(tagline)`,
      [garage.name, garage.city, garage.tagline],
    );
  }

  const [modelRows] = await pool.query<(RowDataPacket & { id: number; make: string; model: string; trim_name: string })[]>(
    "SELECT id, make, model, trim_name FROM car_models",
  );
  const [garageRows] = await pool.query<(RowDataPacket & { id: number; name: string })[]>(
    "SELECT id, name FROM garages",
  );

  const modelId = new Map(
    modelRows.map((r) => [`${r.make}|${r.model}|${r.trim_name}`, Number(r.id)]),
  );
  const garageId = new Map(garageRows.map((r) => [r.name, Number(r.id)]));

  const [countRows] = await pool.query<(RowDataPacket & { count: number })[]>(
    "SELECT COUNT(*) AS count FROM listings",
  );
  if (Number(countRows[0]?.count ?? 0) > 0) {
    return;
  }

  for (const listing of buildSeedListings()) {
    const carId = modelId.get(`${listing.make}|${listing.model}|${listing.trimName}`);
    const gId = garageId.get(listing.garageName);
    if (!carId || !gId) {
      continue;
    }
    await pool.query(
      `INSERT INTO listings
        (car_model_id, garage_id, condition_type, year, colour, mileage, coin_price, owner_label, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
      [
        carId,
        gId,
        listing.conditionType,
        listing.year,
        listing.colour,
        listing.mileage,
        listing.coinPrice,
        listing.ownerLabel,
      ],
    );
  }
}
