"use client";

import { useState, useTransition } from "react";
import { setOpenToChat } from "./chat-status-actions";

export default function OpenToChatToggle({
  experienceId,
  initialOpen,
}: {
  experienceId: string;
  initialOpen: boolean;
}) {
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
      className="text-xs font-semibold px-3.5 py-2 rounded-[12px] border transition-all duration-200 hover:opacity-80 disabled:opacity-40 active:scale-[0.97]"
      style={
        open
          ? { background: "var(--status-open)", borderColor: "var(--status-open)", color: "#fff" }
          : { background: "var(--surface-base)", borderColor: "var(--border-strong)", color: "var(--text-secondary)" }
      }
    >
      {open ? "💬 Chatting · end" : "💬 Chat"}
    </button>
  );
}
