export type CarCueSource = {
  make: string;
  model: string;
  trimName: string;
  bodyType: string;
  fuel: string;
  bhp: number;
  topSpeedMph: number;
  zeroToSixtySecs: number;
};

export type CueCard = {
  id: string;
  title: string;
  prompt: string;
};

/** Cue cards inspired by in-bay review flow — original copy, not Carwow. */
export function buildCueCards(car: CarCueSource): CueCard[] {
  const name = `${car.make} ${car.model}${car.trimName ? ` ${car.trimName}` : ""}`;
  return [
    {
      id: "intro",
      title: "Intro",
      prompt: `Welcome to the bay. Today you’re in the ${name}.`,
    },
    {
      id: "look",
      title: "Look",
      prompt: `Show the ${car.bodyType.toLowerCase()} shape. What’s the first thing people notice?`,
    },
    {
      id: "power",
      title: "Power",
      prompt: `${car.bhp} bhp. Does it feel as strong as the number?`,
    },
    {
      id: "pace",
      title: "Pace",
      prompt: `Top speed ${car.topSpeedMph} mph, 0–60 in ${car.zeroToSixtySecs}s. Call the sprint.`,
    },
    {
      id: "fuel",
      title: "Fuel",
      prompt: `It’s ${car.fuel.toLowerCase()}. Any quirks on the move?`,
    },
    {
      id: "verdict",
      title: "Verdict",
      prompt: `Would you keep the ${car.make} ${car.model} in Brad’s garage?`,
    },
  ];
}
