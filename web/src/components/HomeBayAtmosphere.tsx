/** Decorative Midnight Garage lighting + bay floor for the home hero only. */
export function HomeBayAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[28rem] overflow-hidden" aria-hidden>
      <div className="home-bay-glow absolute inset-0" />
      <div className="home-bay-floor absolute inset-x-0 bottom-0 h-40" />
      <div className="home-bay-rails absolute inset-y-8 left-[8%] hidden w-px sm:block" />
      <div className="home-bay-rails absolute inset-y-8 right-[8%] hidden w-px sm:block" />
    </div>
  );
}
