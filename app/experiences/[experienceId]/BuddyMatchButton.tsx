"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runBuddyMatching } from "./buddy-actions";

export default function BuddyMatchButton({ experienceId }: { experienceId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await runBuddyMatching(experienceId);
        if (result.error) {
          setMessage(result.error);
          return;
        }
        setMessage(
          `Matched ${result.matched} people!${result.leftOver ? " (1 person left over this week)" : ""}`
        );
        router.refresh();
      } catch (err: any) {
        setMessage("Something went wrong.");
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
        {isPending ? "Matching..." : "🤝 Run buddy matching"}
      </button>
      {message && <p className="absolute left-0 top-[110%] z-10 text-xs font-medium w-max p-2 rounded-lg shadow-md border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>{message}</p>}
    </div>
  );
}
