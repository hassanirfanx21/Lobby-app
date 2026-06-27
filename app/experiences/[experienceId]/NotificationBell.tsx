"use client";

import { useState } from "react";
import { dismissWaves } from "./wave-actions";
import { dismissProfileViews } from "./view-actions";

type Wave = { from_user_id: string; from_name: string; from_username: string | null };
type View = { viewer_user_id: string; viewer_name: string | null };

export default function NotificationBell({
  waves,
  views,
  experienceId,
}: {
  waves: Wave[];
  views: View[];
  experienceId: string;
}) {
  const [open, setOpen] = useState(false);
  const [wavesHidden, setWavesHidden] = useState(false);
  const [viewsHidden, setViewsHidden] = useState(false);

  const visibleWaves = wavesHidden ? [] : waves;
  const visibleViews = viewsHidden ? [] : views;
  const totalUnread = visibleWaves.length + visibleViews.length;

  const groupedWaves = new Map<string, { name: string; username: string | null; count: number }>();
  for (const w of visibleWaves) {
    const existing = groupedWaves.get(w.from_user_id);
    if (existing) existing.count += 1;
    else groupedWaves.set(w.from_user_id, { name: w.from_name, username: w.from_username, count: 1 });
  }
  const uniqueWaves = Array.from(groupedWaves.values());

  const uniqueViewers = Array.from(
    new Map(visibleViews.map((v) => [v.viewer_user_id, v.viewer_name ?? "Someone"])).values()
  );

  const items: { key: string; content: React.ReactNode }[] = [];

  if (uniqueWaves.length > 0) {
    items.push({
      key: "waves",
      content: (
        <div
          className="p-4 rounded-[16px] border text-sm"
          style={{
            background: "var(--surface-sunken)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-jakarta)" }}>
              👋 Waves
            </span>
            <button
              onClick={() => { setWavesHidden(true); dismissWaves(experienceId); }}
              className="text-xs font-medium opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-secondary)" }}
            >
              Dismiss
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueWaves.map((w, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-medium border"
                style={{
                  background: "var(--surface-raised)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                {w.name}
                {w.count > 1 && (
                  <span
                    className="rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {w.count}
                  </span>
                )}
                {w.username && (
                  <a
                    href={`https://whop.com/@${w.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline opacity-80 hover:opacity-100 transition-opacity"
                    style={{ color: "var(--accent)" }}
                  >
                    msg
                  </a>
                )}
              </span>
            ))}
          </div>
        </div>
      ),
    });
  }

  if (uniqueViewers.length > 0) {
    items.push({
      key: "views",
      content: (
        <div
          className="p-4 rounded-[16px] border text-sm flex items-center justify-between gap-4"
          style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
        >
          <span className="leading-snug">
            👀 <strong style={{ fontFamily: "var(--font-jakarta)" }}>{uniqueViewers.join(", ")}</strong> checked your profile this week.
          </span>
          <button
            onClick={() => { setViewsHidden(true); dismissProfileViews(experienceId); }}
            className="text-xs font-medium shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
          >
            Dismiss
          </button>
        </div>
      ),
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-200 hover:opacity-80 active:scale-[0.95]"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-strong)",
          color: "var(--text-primary)",
        }}
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {totalUnread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm"
            style={{ background: "var(--accent)", color: "#fff", border: "2px solid var(--surface-raised)" }}
          >
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Drawer */}
          <div
            className="fixed left-4 right-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-12 z-50 sm:w-[360px] rounded-[24px] border card-shadow p-5 flex flex-col gap-3"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <p className="text-[11px] font-bold tracking-widest px-1 mb-1" style={{ color: "var(--text-tertiary)" }}>
              ACTIVITY
            </p>
            {items.length === 0 ? (
              <p className="text-sm text-center py-8 font-medium" style={{ color: "var(--text-tertiary)" }}>
                No new activity
              </p>
            ) : (
              items.map((item) => <div key={item.key}>{item.content}</div>)
            )}
          </div>
        </>
      )}
    </div>
  );
}
