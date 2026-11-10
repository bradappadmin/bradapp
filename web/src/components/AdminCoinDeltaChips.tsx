import { ADMIN_COIN_ADJUST_PRESETS } from "../admin-coin-adjust-presets";

type Props = {
  memberLabel: string;
  value: string;
  disabled?: boolean;
  onSelect: (amount: number) => void;
};

/** Quick +delta chips for admin coin correct — free-form Coin delta stays beside them. */
export function AdminCoinDeltaChips({ memberLabel, value, disabled, onSelect }: Props) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-steel">Quick amount</p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={`Coin adjust presets for ${memberLabel}`}
      >
        {ADMIN_COIN_ADJUST_PRESETS.map((amount) => {
          const active = value === String(amount);
          return (
            <button
              key={amount}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onSelect(amount)}
              className={`rounded-md border px-3 py-1.5 font-display text-sm transition disabled:opacity-60 ${
                active
                  ? "border-lime/50 bg-lime/10 text-lime"
                  : "border-white/15 text-mist hover:border-lime/35 hover:text-lime"
              }`}
            >
              +{amount} BC
            </button>
          );
        })}
      </div>
    </div>
  );
}
