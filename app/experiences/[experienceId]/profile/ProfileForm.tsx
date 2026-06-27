"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "./actions";

import { TagOption } from "../tag-actions";

const ICEBREAKERS = [
  "Currently building...",
  "Ask me about...",
  "Looking for...",
  "Outside this community I...",
];



export default function ProfileForm({
  experienceId,
  name,
  photoUrl,
  initialBio,
  initialTags,
  initialAllowMessages,
  initialBuddyOptIn = false,
  initialStatusLine,
  initialCoordinationTags,
  availableTags,
  availableCoordinationTags,
}: {
  experienceId: string;
  name: string;
  photoUrl: string | null;
  initialBio: string;
  initialTags: string[];
  initialAllowMessages: boolean;
  initialBuddyOptIn: boolean;
  initialStatusLine?: string;
  initialCoordinationTags?: string[];
  availableTags: TagOption[];
  availableCoordinationTags: TagOption[];
}) {
  const [bio, setBio] = useState(initialBio);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [allowMessages, setAllowMessages] = useState(initialAllowMessages);
  const [buddyOptIn, setBuddyOptIn] = useState(initialBuddyOptIn ?? false);
  const [statusLine, setStatusLine] = useState(initialStatusLine ?? "");
  const [coordinationTags, setCoordinationTags] = useState<string[]>(initialCoordinationTags ?? []);

  // Compute what to display based on edge case rule: if NO active tags, show deactivated ones
  const activeInterestTags = availableTags.filter(t => t.is_active);
  const displayInterestTags = activeInterestTags.length > 0 ? activeInterestTags : availableTags;

  const activeCoordinationTags = availableCoordinationTags.filter(t => t.is_active);
  const displayCoordinationTags = activeCoordinationTags.length > 0 ? activeCoordinationTags : availableCoordinationTags;

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const bioRef = useRef<HTMLTextAreaElement>(null);

  function insertPrompt(prompt: string) {
    const el = bioRef.current;
    if (!el) return;
    const start = el.selectionStart ?? bio.length;
    const end = el.selectionEnd ?? bio.length;
    const before = bio.slice(0, start);
    const after = bio.slice(end);
    const needsSpace = before.length > 0 && !before.endsWith(" ") && !before.endsWith("\n");
    const insertion = (needsSpace ? " " : "") + prompt + " ";
    const newBio = (before + insertion + after).slice(0, 280);
    setBio(newBio);
    requestAnimationFrame(() => {
      el.focus();
      const pos = (before + insertion).length;
      el.setSelectionRange(pos, pos);
    });
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5
          ? [...prev, tag]
          : prev,
    );
  }

  function toggleCoordinationTag(tag: string) {
    setCoordinationTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 2
          ? [...prev, tag]
          : prev,
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const formData = new FormData();
    formData.set("experienceId", experienceId);
    formData.set("bio", bio);
    tags.forEach((t) => formData.append("tags", t));
    coordinationTags.forEach((t) => formData.append("coordinationTags", t));
    if (allowMessages) formData.set("allowMessages", "on");
    if (buddyOptIn) formData.set("buddyOptIn", "on");
    formData.set("statusLine", statusLine.slice(0, 50));

    startTransition(async () => {
      try {
        await saveProfile(formData);
        setSaved(true);
        setTimeout(() => router.push(`/experiences/${experienceId}`), 800);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong. Try again.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[20px] border p-6 card-shadow"
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full" style={{ background: "var(--border-subtle)" }} />
        )}
        <div>
          <p className="font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-jakarta)" }}>{name}</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Pulled automatically from Whop
          </p>
        </div>
      </div>

      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Status (optional)</label>
      <input
        type="text"
        value={statusLine}
        onChange={(e) => setStatusLine(e.target.value)}
        maxLength={50}
        placeholder="What are you up to right now?"
        className="w-full rounded-xl p-2.5 text-sm mb-4 outline-none transition border"
        style={{
          background: "var(--surface-base)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
      />

      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
        Bio
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {ICEBREAKERS.map((prompt) => (
          <button
            type="button"
            key={prompt}
            onClick={() => insertPrompt(prompt)}
            className="text-xs px-2.5 py-1 rounded-full border border-dashed hover:opacity-80 transition"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            {prompt}
          </button>
        ))}
      </div>
      <textarea
        ref={bioRef}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={280}
        rows={3}
        placeholder="Tell the community a bit about you..."
        className="w-full rounded-xl p-3 text-sm mb-1 outline-none transition border"
        style={{
          background: "var(--surface-base)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
      />
      <p className="text-xs text-right mb-4" style={{ color: "var(--text-secondary)" }}>
        {bio.length}/280
      </p>

      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
        Tags <span style={{ color: "var(--text-secondary)" }}>(pick up to 5)</span>
      </label>
      <div className="flex flex-wrap gap-2 mb-6">
        {displayInterestTags.map((opt) => {
          const active = tags.includes(opt.label);
          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => toggleTag(opt.label)}
              className="text-sm px-3 py-1.5 rounded-full border transition hover:opacity-80"
              style={
                active
                  ? { background: "var(--text-primary)", borderColor: "var(--text-primary)", color: "var(--surface-base)" }
                  : { background: "var(--surface-base)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
        Current Goals <span style={{ color: "var(--text-secondary)" }}>(pick up to 2)</span>
      </label>
      <div className="flex flex-wrap gap-2 mb-6">
        {displayCoordinationTags.map((opt) => {
          const active = coordinationTags.includes(opt.label);
          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => toggleCoordinationTag(opt.label)}
              className="text-sm px-3 py-1.5 rounded-full border transition hover:opacity-80"
              style={
                active
                  ? { background: "var(--status-open)", borderColor: "var(--status-open)", color: "#fff" }
                  : { background: "var(--surface-base)", borderColor: "var(--status-open)", color: "var(--status-open)" }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 mb-6 text-sm" style={{ color: "var(--text-primary)" }}>
        <input
          type="checkbox"
          checked={allowMessages}
          onChange={(e) => setAllowMessages(e.target.checked)}
          className="rounded"
        />
        Allow other members to message me from Lobby
      </label>

      <label className="flex items-center gap-2 mb-6 text-sm" style={{ color: "var(--text-primary)" }}>
        <input
          type="checkbox"
          checked={buddyOptIn}
          onChange={(e) => setBuddyOptIn(e.target.checked)}
          className="rounded"
        />
        Opt into weekly Buddy Matching (get randomly paired with someone new)
      </label>

      {error && <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>{error}</p>}
      {saved && (
        <p className="text-sm mb-4" style={{ color: "var(--status-active)" }}>
          Saved! Taking you to the directory...
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl py-2.5 text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        {isPending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
