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
    <div
      className="mb-8 rounded-[16px] px-4 py-3 flex items-center justify-between text-sm border"
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--border-subtle)",
        color: "var(--text-primary)",
      }}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <span
          className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full live-pulse tracking-wider"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          LIVE
        </span>
        <span className="truncate">
          <strong style={{ fontFamily: "var(--font-jakarta)" }}>{boost.name}</strong>
          <span className="mx-1.5" style={{ color: "var(--text-tertiary)" }}>·</span>
          <span style={{ color: "var(--text-secondary)" }}>{boost.reason}</span>
        </span>
      </span>
      {isAdmin && (
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="text-xs ml-3 whitespace-nowrap opacity-40 hover:opacity-100 transition-opacity duration-200"
          style={{ color: "var(--text-secondary)" }}
        >
          Remove
        </button>
      )}
    </div>
  );
}
