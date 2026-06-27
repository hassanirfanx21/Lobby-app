"use client";
import { useState, useTransition } from "react";
import { postWeeklyDigest } from "./digest-actions";

export default function DigestButton({ experienceId }: { experienceId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      try {
        await postWeeklyDigest(experienceId);
        setMessage("Posted to Chat!");
      } catch (err: any) {
        setMessage(err.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs font-semibold border px-3 py-2 rounded-[12px] transition-all duration-200 hover:opacity-80 disabled:opacity-40 active:scale-[0.98]"
        style={{
          background: "var(--surface-base)",
          borderColor: "var(--border-strong)",
          color: "var(--text-primary)",
        }}
      >
        {isPending ? "Posting..." : "📊 Post digest"}
      </button>
      {message && <p className="absolute left-0 top-[110%] z-10 text-xs font-medium w-max p-2 rounded-lg shadow-md border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>{message}</p>}
    </div>
  );
}
