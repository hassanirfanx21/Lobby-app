"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "./actions";

const AVAILABLE_TAGS = [
  "Trading",
  "Crypto",
  "Fitness",
  "Marketing",
  "AI",
  "Ecommerce",
  "Real Estate",
  "Content Creation",
  "Networking",
  "Mindset",
  "Gaming",
  "Design",
];

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
}: {
  experienceId: string;
  name: string;
  photoUrl: string | null;
  initialBio: string;
  initialTags: string[];
  initialAllowMessages: boolean;
  initialBuddyOptIn: boolean;
  initialStatusLine?: string;
}) {
  const [bio, setBio] = useState(initialBio);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [allowMessages, setAllowMessages] = useState(initialAllowMessages);
  const [buddyOptIn, setBuddyOptIn] = useState(initialBuddyOptIn ?? false);
  const [statusLine, setStatusLine] = useState(initialStatusLine ?? "");
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const formData = new FormData();
    formData.set("experienceId", experienceId);
    formData.set("bio", bio);
    tags.forEach((t) => formData.append("tags", t));
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
      className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-neutral-200" />
        )}
        <div>
          <p className="font-semibold text-neutral-900">{name}</p>
          <p className="text-xs text-neutral-400">
            Pulled automatically from Whop
          </p>
        </div>
      </div>

      <label className="block text-sm font-medium text-neutral-700 mb-1">Status (optional)</label>
      <input
        type="text"
        value={statusLine}
        onChange={(e) => setStatusLine(e.target.value)}
        maxLength={50}
        placeholder="What are you up to right now?"
        className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-black"
      />

      <label className="block text-sm font-medium text-neutral-700 mb-1">
        Bio
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {ICEBREAKERS.map((prompt) => (
          <button
            type="button"
            key={prompt}
            onClick={() => insertPrompt(prompt)}
            className="text-xs px-2.5 py-1 rounded-full border border-dashed border-neutral-300 text-neutral-500 hover:border-neutral-400"
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
        className="w-full rounded-lg border border-neutral-300 p-3 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-black"
      />
      <p className="text-xs text-neutral-400 text-right mb-4">
        {bio.length}/280
      </p>

      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Tags <span className="text-neutral-400">(pick up to 5)</span>
      </label>
      <div className="flex flex-wrap gap-2 mb-6">
        {AVAILABLE_TAGS.map((tag) => {
          const active = tags.includes(tag);
          return (
            <button
              type="button"
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 mb-6 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={allowMessages}
          onChange={(e) => setAllowMessages(e.target.checked)}
          className="rounded"
        />
        Allow other members to message me from Lobby
      </label>

      <label className="flex items-center gap-2 mb-6 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={buddyOptIn}
          onChange={(e) => setBuddyOptIn(e.target.checked)}
          className="rounded"
        />
        Opt into weekly Buddy Matching (get randomly paired with someone new)
      </label>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {saved && (
        <p className="text-sm text-green-600 mb-4">
          Saved! Taking you to the directory...
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-black text-white py-2.5 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
