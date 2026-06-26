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
        className="text-xs font-medium px-3 py-1.5 rounded-full border transition hover:opacity-80"
        style={{
          background: "var(--accent-soft)",
          borderColor: "var(--accent)",
          color: "var(--accent)",
        }}
      >
        🚀 Boost
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-[20px] max-w-sm w-full p-6 shadow-xl"
            style={{ background: "var(--surface-raised)", color: "var(--text-primary)" }}
          >
            <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: "var(--font-jakarta)" }}>
              Boost your profile
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Pin yourself to the top for 2 hours. Tell the group why — 1 boost per person per week.
            </p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={100}
              placeholder="e.g. Free for calls this week, let's connect!"
              className="w-full rounded-xl p-2.5 text-sm mb-1 outline-none transition"
              style={{
                background: "var(--surface-base)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            />
            <p className="text-xs text-right mb-3" style={{ color: "var(--text-secondary)" }}>
              {reason.length}/100
            </p>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            {done && <p className="text-sm mb-3" style={{ color: "var(--status-active)" }}>{done}</p>}
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={isPending || !reason.trim()}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium transition disabled:opacity-50 hover:opacity-80"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {isPending ? "Boosting…" : "Boost now"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:opacity-80"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)", background: "var(--surface-base)" }}
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
