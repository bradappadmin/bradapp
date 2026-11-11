/** Decorative Midnight Garage lighting for the Top Trumps /play bay. */
export function PlayBayAtmosphere() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[22rem] overflow-hidden sm:h-[26rem]"
      aria-hidden
    >
      <div className="play-bay-glow absolute inset-0" />
      <div className="play-bay-floor absolute inset-x-0 bottom-0 h-36" />
      <div className="home-bay-rails absolute inset-y-10 left-[6%] hidden w-px sm:block" />
      <div className="home-bay-rails absolute inset-y-10 right-[6%] hidden w-px sm:block" />
    </div>
  );
}
