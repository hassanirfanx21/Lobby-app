"use client";

import { useState } from "react";

export default function BuddyReveal({ buddyName }: { buddyName: string }) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="mb-4 inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition hover:opacity-80"
        style={{
          background: "var(--accent-soft)",
          borderColor: "var(--accent)",
          color: "var(--accent)",
        }}
      >
        🤝 You have a buddy this week — Reveal
      </button>
    );
  }

  return (
    <div
      className="mb-4 rounded-xl p-4 text-sm flex items-center justify-between border"
      style={{
        background: "var(--accent-soft)",
        borderColor: "var(--border-subtle)",
        color: "var(--text-primary)",
      }}
    >
      <span>
        🤝 Your buddy this week is{" "}
        <strong style={{ fontFamily: "var(--font-jakarta)" }}>{buddyName}</strong>! Say hi.
      </span>
      <button
        onClick={() => setRevealed(false)}
        className="text-xs ml-3 whitespace-nowrap opacity-50 hover:opacity-100 transition"
        style={{ color: "var(--text-secondary)" }}
      >
        Hide
      </button>
    </div>
  );
}
