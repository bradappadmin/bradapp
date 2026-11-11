import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  dismissAllTips,
  dismissTip,
  loadDismissed,
  saveDismissed,
  visibleTips,
  type TipId,
} from "../first-visit-tips";
import type { User } from "../types";

type FirstVisitTipsProps = {
  user: User;
};

export function FirstVisitTips({ user }: FirstVisitTipsProps) {
  const [dismissed, setDismissed] = useState<TipId[]>(() => loadDismissed(user.id));

  useEffect(() => {
    setDismissed(loadDismissed(user.id));
  }, [user.id]);

  const tips = visibleTips(user.role, dismissed);
  if (tips.length === 0) return null;

  function onDismiss(tipId: TipId) {
    const next = dismissTip(dismissed, tipId);
    setDismissed(next);
    saveDismissed(user.id, next);
  }

  function onDismissAll() {
    const next = dismissAllTips(user.role, dismissed);
    setDismissed(next);
    saveDismissed(user.id, next);
  }

  return (
    <section
      className="bay-rise-delay mt-10 border-t border-white/10 pt-8"
      aria-label="First visit tips"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-mist">Quick tips</h2>
          <p className="mt-1 text-sm text-steel">A short tour of the bay. Dismiss any tip you know.</p>
        </div>
        <button
          type="button"
          onClick={onDismissAll}
          className="border-0 bg-transparent p-0 font-display text-sm text-steel underline hover:text-mist"
        >
          Dismiss all
        </button>
      </div>

      <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
        {tips.map((tip) => (
          <li
            key={tip.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                to={tip.to}
                className="font-display text-base font-semibold text-lime no-underline hover:underline"
              >
                {tip.title}
              </Link>
              <p className="mt-1 text-sm text-steel">{tip.body}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(tip.id)}
              className="shrink-0 self-start rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-mist hover:border-lime/40 hover:text-lime"
              aria-label={`Dismiss ${tip.title} tip`}
            >
              Dismiss
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
