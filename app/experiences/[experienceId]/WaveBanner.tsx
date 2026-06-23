"use client";
import { useState } from "react";
import { dismissWaves } from "./wave-actions";

export default function WaveBanner({ names, experienceId }: { names: string[]; experienceId: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 flex items-center justify-between">
      <span>👋 {names.join(", ")} waved at you!</span>
      <button
        onClick={() => {
          setHidden(true);
          dismissWaves(experienceId);
        }}
        className="text-xs underline ml-3"
      >
        Dismiss
      </button>
    </div>
  );
}
