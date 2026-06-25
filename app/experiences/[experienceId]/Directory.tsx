"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { verifyProfile } from "./badge-actions";
import { sendWave } from "./wave-actions";

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
  status_line?: string | null;
  last_active_at?: string | null;
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
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const dateFor = (p: Profile) => p.joined_at ?? p.created_at;

  const ogIds = [...profiles]
    .sort((a, b) => new Date(dateFor(a)).getTime() - new Date(dateFor(b)).getTime())
    .slice(0, 10)
    .map((p) => p.id);

  const isNew = (p: Profile) => {
    if (!now) return false;
    const days = (now - new Date(dateFor(p)).getTime()) / (1000 * 60 * 60 * 24);
    return days < 7;
  };

  const isActiveNow = (p: Profile) => {
    if (!now || !p.last_active_at) return false;
    const minutes = (now - new Date(p.last_active_at).getTime()) / (1000 * 60);
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
        if (result.isMutual) {
          setToast("✨ It's a mutual wave!");
          setTimeout(() => setToast(null), 4000);
        }
      } catch (err: any) {
        alert(err.message ?? "Couldn't send wave.");
      }
    });
  }

  const others = profiles.filter((p) => p.user_id !== currentUserId);
  const filteredOthers = others.filter((p) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  function renderCard(p: Profile, pinned: boolean) {
    return (
      <div
        key={p.id}
        className={`rounded-xl p-4 flex gap-3 ${
          pinned
            ? "border-2 border-black bg-neutral-50 shadow-sm"
            : "border border-neutral-200 bg-white"
        }`}
      >
        <Link href={`/experiences/${experienceId}/u/${p.user_id}`} prefetch={false} className="relative w-12 h-12 shrink-0">
          {p.photo_url ? (
            <img src={p.photo_url} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-200" />
          )}
          {isActiveNow(p) && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </Link>
        <div className="flex-1">
          <Link href={`/experiences/${experienceId}/u/${p.user_id}`} prefetch={false}>
            <p className="font-medium text-neutral-900">
              {p.name}
              {p.user_id === currentUserId && (
                <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-neutral-500 bg-neutral-100 rounded">
                  YOU
                </span>
              )}
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
          </Link>
          {p.status_line && <p className="text-xs text-neutral-400">{p.status_line}</p>}
          <p className="text-sm text-neutral-500 line-clamp-2">{p.bio}</p>
          {p.tags && p.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {p.tags.map((t) => (
                <span key={t} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
          {sharedTags(p).length > 0 && (
            <p className="text-xs text-emerald-600 mt-1">You both like {sharedTags(p).join(", ")}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            {p.user_id !== currentUserId && p.allow_messages && p.username && (
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
            {isAdmin && (
              <button
                onClick={() => handleVerify(p.id, !!p.is_verified)}
                disabled={isPending}
                className="text-xs font-medium border border-neutral-300 px-3 py-1.5 rounded-full hover:border-neutral-400 transition disabled:opacity-50"
              >
                {p.is_verified ? "Unverify" : "Mark Verified"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
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

      {me && <div className="mb-6">{renderCard(me, true)}</div>}

      {filteredOthers.length === 0 && (
        <div className="text-center text-neutral-400 py-16">
          {query ? `No matches for "${query}"` : "No one else here yet."}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {filteredOthers.map((p) => renderCard(p, false))}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
