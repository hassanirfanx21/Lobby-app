"use client";

import { useState, useTransition } from "react";
import TagSettingsModal from "./TagSettingsModal";
import { getTagOptions, TagOption } from "./tag-actions";

export default function TagSettingsButton({ experienceId }: { experienceId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [interests, setInterests] = useState<TagOption[]>([]);
  const [coordination, setCoordination] = useState<TagOption[]>([]);

  function handleClick() {
    startTransition(async () => {
      try {
        const [iTags, cTags] = await Promise.all([
          getTagOptions(experienceId, "interest"),
          getTagOptions(experienceId, "coordination")
        ]);
        setInterests(iTags);
        setCoordination(cTags);
        setOpen(true);
      } catch (err: any) {
        alert(err.message ?? "Couldn't load tags");
      }
    });
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs font-semibold px-3 py-2 rounded-[12px] border transition-all duration-200 hover:opacity-80 disabled:opacity-40"
        style={{
          background: "var(--surface-base)",
          borderColor: "var(--border-strong)",
          color: "var(--text-secondary)",
        }}
      >
        {isPending ? "Loading..." : "⚙️ Edit Tags"}
      </button>

      {open && (
        <TagSettingsModal
          experienceId={experienceId}
          initialInterests={interests}
          initialCoordination={coordination}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
