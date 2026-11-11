import { useState } from "react";
import { absoluteShareUrl, copyTextToClipboard } from "../share-link";
import { useToast } from "../toast-context";

type CopyShareLinkButtonProps = {
  path: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

export function CopyShareLinkButton({
  path,
  label = "Copy link",
  copiedLabel = "Copied",
  className = "",
}: CopyShareLinkButtonProps) {
  const toast = useToast();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function onCopy() {
    const url = absoluteShareUrl(path);
    const ok = await copyTextToClipboard(url);
    setStatus(ok ? "copied" : "failed");
    if (ok) toast.success("Link copied.");
    else toast.error("Could not copy link.");
    window.setTimeout(() => setStatus("idle"), 2000);
  }

  const text =
    status === "copied" ? copiedLabel : status === "failed" ? "Copy failed" : label;

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className={
        className ||
        "rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist transition hover:border-lime/40 hover:text-lime"
      }
      aria-live="polite"
    >
      {text}
    </button>
  );
}
