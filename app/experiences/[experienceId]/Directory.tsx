"use client";

import { useState, useTransition } from "react";
import { verifyProfile } from "./badge-actions";
import { sendWave } from "./wave-actions";
import Link from "next/link";

type Profile = {
  id: string;
  user_id: string;
  username: string | null;
  name: string;
  photo_url: string | null;
  bio: string | null;
  tags: string[] | null;
  allow_messages: boolean;
  joined_at: string | null;
  created_at: string;
  is_verified?: boolean;
  last_active_at: string | null;
  status_line: string | null;
};

export default function Directory({
  profiles,
  currentUserId,
  experienceId,
  isAdmin,
}: {
  profiles: Profile[];
  currentUserId: string;
  experienceId: string;
  isAdmin?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [wavedIds, setWavedIds] = useState<Set<string>>(new Set());

  const filtered = profiles.filter((p) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const dateFor = (p: Profile) => p.joined_at ?? p.created_at;

  const ogIds = [...profiles]
    .sort(
      (a, b) => new Date(dateFor(a)).getTime() - new Date(dateFor(b)).getTime(),
    )
    .slice(0, 10)
    .map((p) => p.id);

  const isNew = (p: Profile) => {
    const days =
      (Date.now() - new Date(dateFor(p)).getTime()) / (1000 * 60 * 60 * 24);
    return days < 7;
  };

  const isActiveNow = (p: Profile) => {
    if (!p.last_active_at) return false;
    const minutes = (Date.now() - new Date(p.last_active_at).getTime()) / (1000 * 60);
    return minutes < 10;
  };

  const me = profiles.find((p) => p.user_id === currentUserId);

  const sharedTags = (p: Profile) => {
    if (!me || p.user_id === currentUserId) return [];
    return (p.tags ?? []).filter((t) => me.tags?.includes(t));
  };
  function handleVerify(profileId: string, currentlyVerified: boolean) {
    startTransition(async () => {
      try {
        await verifyProfile(experienceId, profileId, !currentlyVerified);
      } catch (err: any) {
        alert(err.message ?? "Couldn't update verification.");
      }
    });
  }

  function handleWave(toUserId: string) {
    startTransition(async () => {
      try {
        const result = await sendWave(experienceId, toUserId);
        setWavedIds((prev) => new Set(prev).add(toUserId));
        if (result.isMutual) alert("✨ It's a mutual wave!");
      } catch (err: any) {
        alert(err.message ?? "Couldn't send wave.");
      }
    });
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or tag..."
        className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-black"
      />

      {filtered.length === 0 && (
        <div className="text-center text-neutral-400 py-16">
          No matches for "{query}"
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 flex gap-3"
          >
            <div className="relative w-12 h-12 shrink-0">
              <Link href={`/experiences/${experienceId}/u/${p.user_id}`}>
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-200" />
                )}
              </Link>
              {isActiveNow(p) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">
                {p.name}
                {isNew(p) && (
                  <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-green-700 bg-green-100 rounded">
                    NEW
                  </span>
                )}
                {ogIds.includes(p.id) && (
                  <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-purple-700 bg-purple-100 rounded">
                    OG
                  </span>
                )}
                {p.is_verified && (
                  <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 bg-blue-100 rounded">
                    VERIFIED
                  </span>
                )}
              </p>
              {p.status_line && <p className="text-xs text-neutral-400">{p.status_line}</p>}
              <p className="text-sm text-neutral-500 line-clamp-2">{p.bio}</p>
              {p.tags && p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {sharedTags(p).length > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                  You both like {sharedTags(p).join(", ")}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 items-center">
                {p.user_id !== currentUserId &&
                  p.allow_messages &&
                  p.username && (
                    <a
                      href={`https://whop.com/@${p.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-medium bg-black text-white px-3 py-1.5 rounded-full hover:bg-neutral-800 transition"
                    >
                      Message
                    </a>
                  )}
                {p.user_id !== currentUserId && (
                  <button
                    onClick={() => handleWave(p.user_id)}
                    disabled={isPending || wavedIds.has(p.user_id)}
                    className="text-xs font-medium border border-neutral-300 px-3 py-1.5 rounded-full hover:border-neutral-400 transition disabled:opacity-50"
                  >
                    {wavedIds.has(p.user_id) ? "👋 Waved!" : "👋 Wave"}
                  </button>
                )}
                {isAdmin && handleVerify && (
                  <button
                    onClick={() => handleVerify(p.id, p.is_verified ?? false)}
                    disabled={isPending}
                    className="text-xs font-medium border border-neutral-300 px-3 py-1.5 rounded-full hover:border-neutral-400 transition disabled:opacity-50"
                  >
                    {p.is_verified ? "Unverify" : "Mark Verified"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
