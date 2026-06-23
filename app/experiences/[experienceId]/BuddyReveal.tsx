"use client";

import { useState } from "react";

export default function BuddyReveal({ buddyName }: { buddyName: string }) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium bg-purple-50 border border-purple-200 text-purple-900 px-3 py-1.5 rounded-full hover:bg-purple-100 transition"
      >
        🤝 You have a buddy this week — Reveal
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900 flex items-center justify-between">
      <span>
        🤝 Your buddy this week is <strong>{buddyName}</strong>! Say hi.
      </span>
      <button
        onClick={() => setRevealed(false)}
        className="text-xs underline ml-3 whitespace-nowrap"
      >
        Hide
      </button>
    </div>
  );
}
