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
        setToast(err.message ?? "Couldn't update verification.");
        setTimeout(() => setToast(null), 3000);
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
        setToast(err.message ?? "Couldn't send wave.");
        setTimeout(() => setToast(null), 3000);
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

  function renderCard(p: Profile) {
    const ringClass = avatarRingClass(p);
    const shared = sharedTags(p);

    return (
      <div
        key={p.id}
        className="lobby-card group rounded-[20px] p-5 border flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.02] min-h-[360px]"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Avatar */}
        <Link
          href={`/experiences/${experienceId}/u/${p.user_id}`}
          prefetch={false}
          className={`shrink-0 mb-2.5 ${ringClass}`}
        >
          {p.photo_url ? (
            <img
              src={p.photo_url}
              alt={p.name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold"
              style={{ background: "var(--surface-sunken)", color: "var(--text-tertiary)" }}
            >
              {p.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          )}
        </Link>

        {/* Badges row */}
        <div className="flex min-h-[18px] items-center gap-1 mb-1 flex-wrap justify-center">
          {isOpenToChatNow(p) && (
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded"
              style={{ background: "var(--status-open)", color: "#fff" }}
            >
              CHATTING
            </span>
          )}
          {boostedUserId && p.user_id === boostedUserId && (
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded live-pulse"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              BOOSTED
            </span>
          )}
          {isNew(p) && (
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded"
              style={{ background: "var(--status-active)", color: "#fff" }}
            >
              NEW
            </span>
          )}
          {ogIds.includes(p.id) && !isNew(p) && (
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded"
              style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              OG
            </span>
          )}
          {p.is_verified && (
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded"
              style={{ background: "var(--status-open)", color: "#fff" }}
            >
              ✓
            </span>
          )}
        </div>

        {/* Name */}
        <Link href={`/experiences/${experienceId}/u/${p.user_id}`} prefetch={false} className="mt-0.5">
          <p
            className="font-semibold text-[15px] leading-tight"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-jakarta)" }}
          >
            {p.name}
          </p>
        </Link>

        {/* Status */}
        {p.status_line && (
          <p className="text-xs mt-1 truncate max-w-full" style={{ color: "var(--text-tertiary)" }}>
            {p.status_line}
          </p>
        )}

        {/* Bio / content block */}
        <div className="mt-2 flex min-h-[2.4rem] w-full items-start justify-center">
          {p.bio ? (
            <p className="text-[13px] line-clamp-2 leading-relaxed text-center" style={{ color: "var(--text-secondary)" }}>
              {p.bio}
            </p>
          ) : (
            <div className="h-[2.4rem] w-full" />
          )}
        </div>

        {/* Tags */}
        {p.tags && p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {p.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--surface-sunken)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {t}
              </span>
            ))}
            {p.tags.length > 3 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: "var(--text-tertiary)" }}>
                +{p.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Coordination tags */}
        {p.coordination_tags && p.coordination_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 justify-center">
            {p.coordination_tags.map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: "var(--status-open)", color: "#fff", opacity: 0.85 }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Shared interests */}
        {shared.length > 0 && (
          <div className="mt-2 mb-2 flex w-full justify-center min-h-[1.75rem]">
            <div
              className="inline-flex max-w-full items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-4 text-center"
              style={{
                background: "var(--surface-base)",
                color: "var(--accent)",
                border: "1px solid var(--accent)",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              <span className="shrink-0">✨</span>
              <span className="break-words">You both like {shared.join(", ")}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2 w-full">
          {p.allow_messages && p.username && (
            <a
              href={`https://whop.com/@${p.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-xs font-semibold py-2 rounded-[12px] transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Message
            </a>
          )}
          <button
            onClick={() => handleWave(p.user_id)}
            disabled={isPending || wavedIds.has(p.user_id)}
            className="flex-1 text-center text-xs font-semibold py-2 rounded-[12px] border transition-all duration-200 disabled:opacity-40 hover:opacity-80 active:scale-[0.97]"
            style={{
              borderColor: "var(--border-strong)",
              color: "var(--text-secondary)",
              background: "var(--surface-base)",
            }}
          >
            {wavedIds.has(p.user_id) ? "Waved ✓" : "👋 Wave"}
          </button>
          {isAdmin && (
            <button
              onClick={() => handleVerify(p.id, !!p.is_verified)}
              disabled={isPending}
              className="text-xs font-medium px-2.5 py-2 rounded-[12px] border transition disabled:opacity-40 hover:opacity-80"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)", background: "var(--surface-base)" }}
            >
              {p.is_verified ? "✗" : "✓"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const myCard = profiles.find((p) => p.user_id === currentUserId);

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <p
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Members
        </p>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}
        >
          {others.length}
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-tertiary)" }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          placeholder="Search by name or tag…"
          className="w-full rounded-[14px] pl-9 pr-4 py-2.5 text-sm outline-none transition-all duration-200"
          style={{
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs hover:opacity-80"
            style={{ color: "var(--text-tertiary)" }}
          >✕</button>
        )}
      </div>

      {/* Empty state */}
      {filteredOthers.length === 0 && (
        <div
          className="text-center py-16 rounded-[20px]"
          style={{ color: "var(--text-tertiary)", background: "var(--surface-sunken)" }}
        >
          <span className="text-4xl mb-3 block">🔎</span>
          <p className="text-sm">{query ? `No matches for "${query}"` : "No one else here yet."}</p>
        </div>
      )}

      {/* Card grid: 1 mobile → 2 tablet → 3 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOthers.map((p) => renderCard(p))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50"
          style={{ background: "var(--text-primary)", color: "var(--surface-base)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
