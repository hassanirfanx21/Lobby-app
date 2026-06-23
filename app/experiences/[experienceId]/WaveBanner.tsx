"use client";
import { useState } from "react";
import { dismissWaves } from "./wave-actions";

type Wave = { from_name: string; from_username: string | null };

export default function WaveBanner({
  waves,
  experienceId,
}: {
  waves: Wave[];
  experienceId: string;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden || waves.length === 0) return null;

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
      <div className="flex flex-wrap gap-2">
        {waves.map((w, i) => (
          <span key={i} className="flex items-center gap-1 bg-white rounded-full px-2 py-1 text-xs">
            {w.from_name}
            {w.from_username && (
              <a
                href={`https://whop.com/@${w.from_username}`}
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
