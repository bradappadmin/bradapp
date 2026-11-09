export type ToastTone = "success" | "error";

export type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastViewportProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => {
        const isError = toast.tone === "error";
        return (
          <div
            key={toast.id}
            role={isError ? "alert" : "status"}
            className={`bay-toast pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-md border px-4 py-3 shadow-lg sm:max-w-lg ${
              isError
                ? "border-rose/45 bg-bay-panel/95 text-mist"
                : "border-lime/40 bg-bay-panel/95 text-mist"
            }`}
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                isError ? "bg-rose" : "bg-lime"
              }`}
              aria-hidden
            />
            <p className="min-w-0 flex-1 font-display text-sm font-medium leading-snug text-mist">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-steel transition hover:text-mist"
              aria-label="Dismiss"
            >
              Close
            </button>
          </div>
        );
      })}
    </div>
  );
}
