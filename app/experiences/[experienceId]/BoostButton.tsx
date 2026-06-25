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
        setDone(result.activatedNow ? "You're boosted now! 🚀" : "Queued — you'll go live once the current boost ends.");
        setReason("");
        setTimeout(() => { setOpen(false); setDone(null); }, 2000);
      } catch (err: any) {
        setError(err.message ?? "Couldn't boost right now.");
      }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs font-medium border border-amber-300 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-100 transition">
        🚀 Boost
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-900 mb-1">Boost your profile</h2>
            <p className="text-sm text-neutral-500 mb-4">Pin yourself to the top for 2 hours. Tell the group why — 1 boost per person per week.</p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={100}
              placeholder="e.g. Free for calls this week, let's connect!"
              className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-xs text-neutral-400 text-right mb-3">{reason.length}/100</p>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            {done && <p className="text-sm text-green-600 mb-3">{done}</p>}
            <div className="flex gap-2">
              <button onClick={submit} disabled={isPending || !reason.trim()} className="flex-1 rounded-lg bg-amber-600 text-white py-2.5 text-sm font-medium hover:bg-amber-700 transition disabled:opacity-50">
                {isPending ? "Boosting..." : "Boost now"}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:border-neutral-400 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
