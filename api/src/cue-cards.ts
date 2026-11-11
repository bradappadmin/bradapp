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

function carName(car: CarCueSource): string {
  return `${car.make} ${car.model}${car.trimName ? ` ${car.trimName}` : ""}`;
}

/** Cue cards inspired by in-bay review flow — original copy, not Carwow. */
export function buildCueCards(car: CarCueSource): CueCard[] {
  const name = carName(car);
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

/** Cue cards for a two-car drag race — Mat Watson–style inspiration only, original copy. */
export function buildDragRaceCueCards(carA: CarCueSource, carB: CarCueSource): CueCard[] {
  const a = carName(carA);
  const b = carName(carB);
  return [
    {
      id: "intro",
      title: "Intro",
      prompt: `Drag race in the bay: ${a} versus ${b}. Set the scene.`,
    },
    {
      id: "lane_a",
      title: "Lane A",
      prompt: `${a} — ${carA.bhp} bhp, 0–60 in ${carA.zeroToSixtySecs}s. Why does it look quick?`,
    },
    {
      id: "lane_b",
      title: "Lane B",
      prompt: `${b} — ${carB.bhp} bhp, 0–60 in ${carB.zeroToSixtySecs}s. What’s its edge?`,
    },
    {
      id: "lights",
      title: "Lights",
      prompt: `Tree goes green. Call the launch — who hooks up first?`,
    },
    {
      id: "trap",
      title: "Trap",
      prompt: `Top ends: ${carA.topSpeedMph} mph vs ${carB.topSpeedMph} mph. Who holds it through the trap?`,
    },
    {
      id: "verdict",
      title: "Verdict",
      prompt: `Who wins the drag — ${carA.make} ${carA.model} or ${carB.make} ${carB.model}? Say it loud.`,
    },
  ];
}
