"use client";

import { useState, useTransition } from "react";
import { requestBoost } from "./boost-actions";

export default function BoostButton({ experienceId }: { experienceId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await requestBoost(experienceId, reason);
        if (result.error) {
          setError(result.error);
          return;
        }
        setDone(result.activatedNow ? "You're boosted now! 🚀" : "Queued — you'll go live once the current boost ends.");
        setReason("");
        setTimeout(() => { setOpen(false); setDone(null); }, 2000);
      } catch (err: any) {
        setError("Couldn't boost right now.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3.5 py-2 rounded-[12px] transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
        style={{
          background: "var(--accent)",
          color: "#fff",
        }}
      >
        🚀 Boost
      </button>

      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-modal"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="rounded-[24px] max-w-sm w-full p-6 card-shadow"
            style={{ background: "var(--surface-raised)", color: "var(--text-primary)" }}
          >
            <h2
              className="text-lg font-bold mb-1"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Boost your profile
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Pin yourself to the spotlight for 2 hours. One boost per week.
            </p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={100}
              placeholder="e.g. Free for calls this week, let's connect!"
              className="w-full rounded-[14px] p-3 text-sm mb-1 outline-none transition-all duration-200"
              style={{
                background: "var(--surface-sunken)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            />
            <p className="text-xs text-right mb-4" style={{ color: "var(--text-tertiary)" }}>
              {reason.length}/100
            </p>
            {error && <p className="text-sm mb-3" style={{ color: "var(--error)" }}>{error}</p>}
            {done && <p className="text-sm mb-3" style={{ color: "var(--success)" }}>{done}</p>}
            <div className="flex gap-2.5">
              <button
                onClick={submit}
                disabled={isPending || !reason.trim()}
                className="flex-1 rounded-[14px] py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-40 hover:brightness-110 active:scale-[0.98]"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {isPending ? "Boosting…" : "Boost now"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-[14px] px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-70"
                style={{ color: "var(--text-tertiary)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
