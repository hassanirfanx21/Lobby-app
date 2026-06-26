"use client";

import { useTransition } from "react";
import { cancelBoost } from "./boost-actions";

export default function BoostSpotlight({
  experienceId,
  boost,
  isAdmin,
}: {
  experienceId: string;
  boost: { id: string; name: string; reason: string };
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    if (!confirm("Remove this boost? The next person in queue (if any) goes live immediately.")) return;
    startTransition(async () => {
      await cancelBoost(experienceId, boost.id);
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 flex items-center justify-between">
      <span>🚀 <strong>{boost.name}</strong> is boosted: "{boost.reason}"</span>
      {isAdmin && (
        <button onClick={handleRemove} disabled={isPending} className="text-xs underline ml-3 whitespace-nowrap">
          Remove
        </button>
      )}
    </div>
  );
}
