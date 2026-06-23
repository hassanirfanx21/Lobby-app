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
    <div className="mb-6">
      <button onClick={handleClick} disabled={isPending} className="text-sm font-medium border border-neutral-300 px-4 py-2 rounded-full hover:border-neutral-400 transition disabled:opacity-50">
        {isPending ? "Posting..." : "📊 Post weekly digest"}
      </button>
      {message && <p className="text-xs text-neutral-500 mt-2">{message}</p>}
    </div>
  );
}
