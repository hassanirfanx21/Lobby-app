"use client";

import { useState, useTransition } from "react";
import { setOpenToChat } from "./chat-status-actions";

export default function OpenToChatToggle({ experienceId, initialOpen }: { experienceId: string; initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !open;
    setOpen(next);
    startTransition(async () => { await setOpenToChat(experienceId, next); });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
        open ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400"
      }`}
    >
      {open ? "💬 Open to chat (1hr) — tap to end" : "💬 I'm open to chat right now"}
    </button>
  );
}
