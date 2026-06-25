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
        setMessage(
          `Matched ${result.matched} people!${result.leftOver ? " (1 person left over this week)" : ""}`
        );
        router.refresh();
      } catch (err: any) {
        setMessage(err.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="mb-6">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-sm font-medium border border-neutral-300 px-4 py-2 rounded-full hover:border-neutral-400 transition disabled:opacity-50"
      >
        {isPending ? "Matching..." : "🤝 Run weekly buddy matching"}
      </button>
      {message && <p className="text-xs text-neutral-500 mt-2">{message}</p>}
    </div>
  );
}
