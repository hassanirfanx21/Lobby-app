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
      className="text-xs font-medium px-3 py-1.5 rounded-full border transition hover:opacity-80 disabled:opacity-50"
      style={
        open
          ? { background: "var(--status-open)", borderColor: "var(--status-open)", color: "#fff" }
          : { background: "var(--surface-raised)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }
      }
    >
      {open ? "💬 Open to chat · tap to end" : "💬 Open to chat"}
    </button>
  );
}
