/** Real makes/models with realistic headline specs. Garages/listings are invented elsewhere. */

export type SeedCarModel = {
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

export type SeedGarage = {
  name: string;
  city: string;
  tagline: string;
};

export type SeedListing = {
  make: string;
  model: string;
  trimName: string;
  garageName: string;
  conditionType: "new" | "used";
  year: number;
  colour: string;
  mileage: number;
  coinPrice: number;
  ownerLabel: string;
};

export const SEED_CAR_MODELS: SeedCarModel[] = [
  // Everyday
  { make: "Ford", model: "Focus", trimName: "ST-Line 1.0", bodyType: "Hatchback", fuel: "Petrol", drivetrain: "FWD", doors: 5, seats: 5, bhp: 155, topSpeedMph: 131, zeroToSixtySecs: 8.4 },
  { make: "Volkswagen", model: "Golf", trimName: "Life 1.5 TSI", bodyType: "Hatchback", fuel: "Petrol", drivetrain: "FWD", doors: 5, seats: 5, bhp: 150, topSpeedMph: 132, zeroToSixtySecs: 8.5 },
  { make: "Toyota", model: "Corolla", trimName: "Icon Hybrid", bodyType: "Hatchback", fuel: "Hybrid", drivetrain: "FWD", doors: 5, seats: 5, bhp: 140, topSpeedMph: 112, zeroToSixtySecs: 9.1 },
  { make: "Honda", model: "Civic", trimName: "Elegance 1.5 VTEC", bodyType: "Hatchback", fuel: "Petrol", drivetrain: "FWD", doors: 5, seats: 5, bhp: 182, topSpeedMph: 137, zeroToSixtySecs: 7.8 },
  { make: "Vauxhall", model: "Corsa", trimName: "GS 1.2 Turbo", bodyType: "Hatchback", fuel: "Petrol", drivetrain: "FWD", doors: 5, seats: 5, bhp: 100, topSpeedMph: 117, zeroToSixtySecs: 10.2 },
  { make: "BMW", model: "3 Series", trimName: "320i M Sport", bodyType: "Saloon", fuel: "Petrol", drivetrain: "RWD", doors: 4, seats: 5, bhp: 184, topSpeedMph: 146, zeroToSixtySecs: 7.1 },
  { make: "Mercedes-Benz", model: "C-Class", trimName: "C220d AMG Line", bodyType: "Saloon", fuel: "Diesel", drivetrain: "RWD", doors: 4, seats: 5, bhp: 200, topSpeedMph: 152, zeroToSixtySecs: 7.0 },
  { make: "Audi", model: "A4", trimName: "35 TFSI S line", bodyType: "Saloon", fuel: "Petrol", drivetrain: "FWD", doors: 4, seats: 5, bhp: 150, topSpeedMph: 140, zeroToSixtySecs: 8.9 },
  { make: "Skoda", model: "Octavia", trimName: "SE L 1.5 TSI", bodyType: "Estate", fuel: "Petrol", drivetrain: "FWD", doors: 5, seats: 5, bhp: 150, topSpeedMph: 139, zeroToSixtySecs: 8.5 },
  { make: "Kia", model: "Sportage", trimName: "GT-Line 1.6 T-GDi", bodyType: "SUV", fuel: "Petrol", drivetrain: "FWD", doors: 5, seats: 5, bhp: 148, topSpeedMph: 121, zeroToSixtySecs: 9.5 },
  { make: "Hyundai", model: "Tucson", trimName: "Premium Hybrid", bodyType: "SUV", fuel: "Hybrid", drivetrain: "FWD", doors: 5, seats: 5, bhp: 230, topSpeedMph: 120, zeroToSixtySecs: 7.9 },
  { make: "Nissan", model: "Qashqai", trimName: "N-Connecta 1.3 DIG-T", bodyType: "SUV", fuel: "Petrol", drivetrain: "FWD", doors: 5, seats: 5, bhp: 158, topSpeedMph: 124, zeroToSixtySecs: 9.0 },
  { make: "Tesla", model: "Model 3", trimName: "Long Range", bodyType: "Saloon", fuel: "Electric", drivetrain: "AWD", doors: 4, seats: 5, bhp: 346, topSpeedMph: 145, zeroToSixtySecs: 4.2 },
  { make: "Mini", model: "Cooper", trimName: "Classic", bodyType: "Hatchback", fuel: "Petrol", drivetrain: "FWD", doors: 3, seats: 4, bhp: 136, topSpeedMph: 130, zeroToSixtySecs: 8.1 },
  { make: "Mazda", model: "MX-5", trimName: "Sport 2.0", bodyType: "Convertible", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 2, bhp: 184, topSpeedMph: 136, zeroToSixtySecs: 6.5 },
  { make: "Volvo", model: "XC60", trimName: "B5 Ultra", bodyType: "SUV", fuel: "Hybrid", drivetrain: "AWD", doors: 5, seats: 5, bhp: 250, topSpeedMph: 112, zeroToSixtySecs: 6.9 },
  { make: "Land Rover", model: "Defender", trimName: "110 S D250", bodyType: "SUV", fuel: "Diesel", drivetrain: "AWD", doors: 5, seats: 5, bhp: 249, topSpeedMph: 117, zeroToSixtySecs: 7.9 },
  { make: "Toyota", model: "Yaris", trimName: "Design Hybrid", bodyType: "Hatchback", fuel: "Hybrid", drivetrain: "FWD", doors: 5, seats: 5, bhp: 116, topSpeedMph: 109, zeroToSixtySecs: 9.7 },
  { make: "Peugeot", model: "308", trimName: "Allure 1.2 PureTech", bodyType: "Hatchback", fuel: "Petrol", drivetrain: "FWD", doors: 5, seats: 5, bhp: 130, topSpeedMph: 130, zeroToSixtySecs: 9.7 },
  { make: "Renault", model: "Clio", trimName: "Techno TCe 90", bodyType: "Hatchback", fuel: "Petrol", drivetrain: "FWD", doors: 5, seats: 5, bhp: 90, topSpeedMph: 112, zeroToSixtySecs: 12.2 },
  // Performance
  { make: "Porsche", model: "911", trimName: "Carrera S", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 4, bhp: 444, topSpeedMph: 191, zeroToSixtySecs: 3.5 },
  { make: "Porsche", model: "911", trimName: "GT3", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 2, bhp: 503, topSpeedMph: 198, zeroToSixtySecs: 3.2 },
  { make: "Ferrari", model: "488", trimName: "GTB", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 2, bhp: 661, topSpeedMph: 205, zeroToSixtySecs: 3.0 },
  { make: "Lamborghini", model: "Huracán", trimName: "EVO", bodyType: "Coupe", fuel: "Petrol", drivetrain: "AWD", doors: 2, seats: 2, bhp: 631, topSpeedMph: 202, zeroToSixtySecs: 2.9 },
  { make: "McLaren", model: "720S", trimName: "Coupe", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 2, bhp: 710, topSpeedMph: 212, zeroToSixtySecs: 2.8 },
  { make: "Aston Martin", model: "DB12", trimName: "Coupe", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 4, bhp: 671, topSpeedMph: 202, zeroToSixtySecs: 3.5 },
  { make: "BMW", model: "M3", trimName: "Competition", bodyType: "Saloon", fuel: "Petrol", drivetrain: "RWD", doors: 4, seats: 5, bhp: 503, topSpeedMph: 155, zeroToSixtySecs: 3.8 },
  { make: "BMW", model: "M4", trimName: "Competition", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 4, bhp: 503, topSpeedMph: 155, zeroToSixtySecs: 3.8 },
  { make: "Mercedes-AMG", model: "C 63 S", trimName: "E Performance", bodyType: "Saloon", fuel: "Hybrid", drivetrain: "AWD", doors: 4, seats: 5, bhp: 671, topSpeedMph: 155, zeroToSixtySecs: 3.3 },
  { make: "Audi", model: "RS6", trimName: "Avant", bodyType: "Estate", fuel: "Petrol", drivetrain: "AWD", doors: 5, seats: 5, bhp: 591, topSpeedMph: 155, zeroToSixtySecs: 3.5 },
  { make: "Audi", model: "R8", trimName: "V10 performance", bodyType: "Coupe", fuel: "Petrol", drivetrain: "AWD", doors: 2, seats: 2, bhp: 612, topSpeedMph: 205, zeroToSixtySecs: 3.1 },
  { make: "Nissan", model: "GT-R", trimName: "Premium", bodyType: "Coupe", fuel: "Petrol", drivetrain: "AWD", doors: 2, seats: 4, bhp: 562, topSpeedMph: 196, zeroToSixtySecs: 2.9 },
  { make: "Ford", model: "Mustang", trimName: "GT 5.0", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 4, bhp: 450, topSpeedMph: 155, zeroToSixtySecs: 4.3 },
  { make: "Chevrolet", model: "Corvette", trimName: "Stingray", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 2, bhp: 490, topSpeedMph: 184, zeroToSixtySecs: 2.9 },
  { make: "Jaguar", model: "F-Type", trimName: "R", bodyType: "Coupe", fuel: "Petrol", drivetrain: "AWD", doors: 2, seats: 2, bhp: 575, topSpeedMph: 186, zeroToSixtySecs: 3.5 },
  { make: "Lotus", model: "Emira", trimName: "V6 First Edition", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 2, bhp: 400, topSpeedMph: 180, zeroToSixtySecs: 4.2 },
  { make: "Alpine", model: "A110", trimName: "S", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 2, bhp: 296, topSpeedMph: 162, zeroToSixtySecs: 4.2 },
  { make: "Honda", model: "Civic Type R", trimName: "FL5", bodyType: "Hatchback", fuel: "Petrol", drivetrain: "FWD", doors: 5, seats: 4, bhp: 324, topSpeedMph: 171, zeroToSixtySecs: 5.2 },
  { make: "Volkswagen", model: "Golf R", trimName: "20 Years", bodyType: "Hatchback", fuel: "Petrol", drivetrain: "AWD", doors: 5, seats: 5, bhp: 328, topSpeedMph: 168, zeroToSixtySecs: 4.6 },
  { make: "Toyota", model: "GR Supra", trimName: "3.0 Pro", bodyType: "Coupe", fuel: "Petrol", drivetrain: "RWD", doors: 2, seats: 2, bhp: 335, topSpeedMph: 155, zeroToSixtySecs: 4.1 },
  { make: "Porsche", model: "Taycan", trimName: "Turbo", bodyType: "Saloon", fuel: "Electric", drivetrain: "AWD", doors: 4, seats: 4, bhp: 671, topSpeedMph: 161, zeroToSixtySecs: 2.9 },
  { make: "Rimac", model: "Nevera", trimName: "Base", bodyType: "Coupe", fuel: "Electric", drivetrain: "AWD", doors: 2, seats: 2, bhp: 1914, topSpeedMph: 258, zeroToSixtySecs: 1.7 },
  { make: "Bugatti", model: "Chiron", trimName: "Sport", bodyType: "Coupe", fuel: "Petrol", drivetrain: "AWD", doors: 2, seats: 2, bhp: 1479, topSpeedMph: 261, zeroToSixtySecs: 2.3 },
  { make: "McLaren", model: "P1", trimName: "Coupe", bodyType: "Coupe", fuel: "Hybrid", drivetrain: "RWD", doors: 2, seats: 2, bhp: 903, topSpeedMph: 217, zeroToSixtySecs: 2.6 },
  { make: "Ferrari", model: "SF90 Stradale", trimName: "Coupe", bodyType: "Coupe", fuel: "Hybrid", drivetrain: "AWD", doors: 2, seats: 2, bhp: 986, topSpeedMph: 211, zeroToSixtySecs: 2.3 },
];

export const SEED_GARAGES: SeedGarage[] = [
  { name: "Midnight Motors", city: "Manchester", tagline: "Bay lights on past midnight." },
  { name: "Napwood Performance", city: "Leeds", tagline: "Family-run, loud exhausts welcome." },
  { name: "Coastline Cars", city: "Brighton", tagline: "Salt air and clean estates." },
  { name: "Peak District Picks", city: "Sheffield", tagline: "Weekend drives start here." },
  { name: "Brad's Bay", city: "Birmingham", tagline: "Brad's own floor — ask about the GT3." },
];

const COLOURS = [
  "Midnight Black",
  "Arctic White",
  "Racing Red",
  "British Racing Green",
  "Storm Grey",
  "Laser Blue",
  "Sunset Orange",
  "Silver",
];

const OWNERS = [
  "Garage stock",
  "Alex M",
  "Sam R",
  "Jordan P",
  "Casey L",
  "Riley T",
  "Morgan K",
  "Brad's cousin",
];

function pick<T>(items: T[], index: number): T {
  return items[index % items.length]!;
}

/** Deterministic made-up listings derived from the real model list. */
export function buildSeedListings(): SeedListing[] {
  const listings: SeedListing[] = [];
  let i = 0;
  for (const car of SEED_CAR_MODELS) {
    const garage = pick(SEED_GARAGES, i);
    const isPerformance = car.bhp >= 300;
    const conditionType: "new" | "used" = i % 3 === 0 ? "new" : "used";
    const year = conditionType === "new" ? 2025 : 2016 + (i % 9);
    const mileage = conditionType === "new" ? 10 + (i % 40) : 8000 + i * 1700;
    const baseCoins = isPerformance ? 180 + Math.floor(car.bhp / 4) : 35 + Math.floor(car.bhp / 5);
    const coinPrice = conditionType === "new" ? baseCoins + 40 : baseCoins;
    listings.push({
      make: car.make,
      model: car.model,
      trimName: car.trimName,
      garageName: garage.name,
      conditionType,
      year,
      colour: pick(COLOURS, i * 3),
      mileage,
      coinPrice,
      ownerLabel: conditionType === "new" ? "Garage stock" : pick(OWNERS, i + 2),
    });

    // Second listing for popular/performance cars
    if (isPerformance || i % 4 === 0) {
      const garage2 = pick(SEED_GARAGES, i + 2);
      listings.push({
        make: car.make,
        model: car.model,
        trimName: car.trimName,
        garageName: garage2.name,
        conditionType: "used",
        year: 2018 + (i % 6),
        colour: pick(COLOURS, i * 5 + 1),
        mileage: 12000 + i * 2200,
        coinPrice: Math.max(20, coinPrice - 25),
        ownerLabel: pick(OWNERS, i + 5),
      });
    }
    i += 1;
  }
  return listings;
}
