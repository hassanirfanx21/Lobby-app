"use client";

import { useState } from "react";
import Link from "next/link";

export default function BuddyReveal({ experienceId, buddyId, buddyName }: { experienceId: string; buddyId: string; buddyName: string; }) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="mb-8 inline-flex items-center gap-2.5 text-sm font-semibold px-5 py-3 rounded-[16px] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        style={{
          background: "var(--accent)",
          color: "#fff",
          boxShadow: "0 4px 12px rgba(240, 76, 35, 0.2)",
        }}
      >
        <span className="text-lg">🤝</span>
        You have a new buddy this week! Reveal
      </button>
    );
  }

  return (
    <div
      className="mb-8 rounded-[16px] p-5 text-sm flex items-center justify-between border"
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--accent)",
        boxShadow: "0 4px 12px rgba(240, 76, 35, 0.1)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl animate-bounce">🤝</span>
        <span style={{ color: "var(--text-primary)" }}>
          Your buddy this week is{" "}
          <Link href={`/experiences/${experienceId}/u/${buddyId}`} prefetch={false} className="hover:underline">
            <strong style={{ fontFamily: "var(--font-jakarta)", color: "var(--accent)", fontSize: "16px" }}>
              {buddyName}
            </strong>
          </Link>
          ! Say hi.
        </span>
      </div>
      <button
        onClick={() => setRevealed(false)}
        className="text-xs font-medium ml-4 whitespace-nowrap px-3 py-1.5 rounded-full border transition-colors duration-200 hover:opacity-80"
        style={{
          borderColor: "var(--border-strong)",
          color: "var(--text-secondary)",
          background: "var(--surface-base)",
        }}
      >
        Hide
      </button>
    </div>
  );
}
