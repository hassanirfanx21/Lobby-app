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
  coordination_tags?: string[] | null;
  open_to_chat?: boolean;
  open_to_chat_until?: string | null;
};

export default function Directory({
  profiles,
  currentUserId,
  experienceId,
  isAdmin,
  boostedUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
  experienceId: string;
  isAdmin?: boolean;
  boostedUserId?: string | null;
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

  const isOpenToChatNow = (p: Profile) => {
    if (!now || !p.open_to_chat || !p.open_to_chat_until) return false;
    return new Date(p.open_to_chat_until).getTime() > now;
  };

  // Avatar ring: boosted > open-to-chat > active (priority order)
  const avatarRingClass = (p: Profile): string => {
    if (boostedUserId && p.user_id === boostedUserId) return "avatar-ring avatar-ring--boosted";
    if (isOpenToChatNow(p)) return "avatar-ring avatar-ring--open";
    if (isActiveNow(p)) return "avatar-ring avatar-ring--active";
    return "";
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

  // Others grid — exclude current user (they're in the Front Desk now)
  const others = profiles.filter((p) => p.user_id !== currentUserId);
  const filteredOthers = others.filter((p) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  function renderCard(p: Profile) {
    const ringClass = avatarRingClass(p);

    return (
      <div
        key={p.id}
        className="lobby-card card-shadow group rounded-[20px] p-4 flex gap-3 border transition-transform duration-200 hover:-translate-y-0.5"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Avatar with ring */}
        <Link
          href={`/experiences/${experienceId}/u/${p.user_id}`}
          prefetch={false}
          className={`shrink-0 w-12 h-12 ${ringClass}`}
        >
          {p.photo_url ? (
            <img
              src={p.photo_url}
              alt={p.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full"
              style={{ background: "var(--border-subtle)" }}
            />
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link href={`/experiences/${experienceId}/u/${p.user_id}`} prefetch={false}>
            <p className="font-semibold leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-jakarta)" }}>
              {p.name}
              {/* History badges — flat pills next to name */}
              {isOpenToChatNow(p) && (
                <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider rounded"
                  style={{ background: "var(--status-open)", color: "#fff", opacity: 0.9 }}>
                  OPEN TO CHAT
                </span>
              )}
              {isNew(p) && (
                <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider rounded"
                  style={{ background: "var(--status-active)", color: "#fff", opacity: 0.9 }}>
                  NEW
                </span>
              )}
              {ogIds.includes(p.id) && (
                <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider rounded"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
                  OG
                </span>
              )}
              {p.is_verified && (
                <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider rounded"
                  style={{ background: "var(--status-open)", color: "#fff", opacity: 0.9 }}>
                  ✓
                </span>
              )}
            </p>
          </Link>

          {p.status_line && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
              {p.status_line}
            </p>
          )}
          <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {p.bio}
          </p>

          {/* Interest tags */}
          {p.tags && p.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--surface-base)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Coordination tags */}
          {p.coordination_tags && p.coordination_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {p.coordination_tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--status-open)", color: "#fff", opacity: 0.85 }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Shared interests callout */}
          {sharedTags(p).length > 0 && (
            <p className="text-xs mt-1" style={{ color: "var(--status-active)" }}>
              You both like {sharedTags(p).join(", ")}
            </p>
          )}

          {/* Action row */}
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            {p.allow_messages && p.username && (
              <a
                href={`https://whop.com/@${p.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-medium px-3 py-1.5 rounded-full transition hover:opacity-80"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Message
              </a>
            )}
            <button
              onClick={() => handleWave(p.user_id)}
              disabled={isPending || wavedIds.has(p.user_id)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition disabled:opacity-50 hover:opacity-80"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
                background: "var(--surface-base)",
              }}
            >
              {wavedIds.has(p.user_id) ? "👋 Waved!" : "👋 Wave"}
            </button>
            {isAdmin && (
              <button
                onClick={() => handleVerify(p.id, !!p.is_verified)}
                disabled={isPending}
                className="text-xs font-medium px-3 py-1.5 rounded-full border transition disabled:opacity-50 hover:opacity-80"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)", background: "var(--surface-base)" }}
              >
                {p.is_verified ? "Unverify" : "Verify"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or tag…"
        className="w-full rounded-xl p-3 text-sm mb-5 outline-none transition"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
      />

      {/* Empty state */}
      {filteredOthers.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
          {query ? `No matches for "${query}"` : "No one else here yet."}
        </div>
      )}

      {/* 4-col grid: 1 mobile → 2 tablet → 4 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredOthers.map((p) => renderCard(p))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm px-4 py-2 rounded-full shadow-lg z-50"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
