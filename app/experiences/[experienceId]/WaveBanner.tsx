"use client";
import { useState } from "react";
import { dismissWaves } from "./wave-actions";

type Wave = { from_user_id: string; from_name: string; from_username: string | null };

export default function WaveBanner({
  waves,
  experienceId,
}: {
  waves: Wave[];
  experienceId: string;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden || waves.length === 0) return null;

  const grouped = new Map<string, { name: string; username: string | null; count: number }>();
  for (const w of waves) {
    const existing = grouped.get(w.from_user_id);
    if (existing) existing.count += 1;
    else grouped.set(w.from_user_id, { name: w.from_name, username: w.from_username, count: 1 });
  }
  const uniqueWaves = Array.from(grouped.values());

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      <div className="flex items-center justify-between mb-2">
        <span>👋 You got waved at!</span>
        <button
          onClick={() => {
            setHidden(true);
            dismissWaves(experienceId);
          }}
          className="text-xs underline"
        >
          Dismiss
        </button>
      </div>
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
        {uniqueWaves.map((w, i) => (
          <span key={i} className="flex items-center gap-1.5 bg-white rounded-full px-2 py-1 text-xs">
            {w.name}
            {w.count > 1 && (
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                {w.count}
              </span>
            )}
            {w.username && (
              <a
                href={`https://whop.com/@${w.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                Message
              </a>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
