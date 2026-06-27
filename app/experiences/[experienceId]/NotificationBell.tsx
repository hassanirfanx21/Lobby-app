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
          className="p-3 rounded-xl border text-sm"
          style={{
            background: "var(--accent-soft)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-medium">👋 Waves</span>
            <button
              onClick={() => { setWavesHidden(true); dismissWaves(experienceId); }}
              className="text-xs opacity-50 hover:opacity-100 transition"
              style={{ color: "var(--text-secondary)" }}
            >
              Dismiss
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {uniqueWaves.map((w, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ background: "var(--surface-raised)", color: "var(--text-primary)" }}
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
                    className="underline font-medium"
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
          className="p-3 rounded-xl border text-sm flex items-center justify-between"
          style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
        >
          <span>👀 {uniqueViewers.join(", ")} checked your profile this week.</span>
          <button
            onClick={() => { setViewsHidden(true); dismissProfileViews(experienceId); }}
            className="text-xs ml-3 whitespace-nowrap opacity-50 hover:opacity-100 transition"
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
        className="relative w-9 h-9 flex items-center justify-center rounded-full border transition hover:opacity-80"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
        }}
        aria-label="Notifications"
      >
        🔔
        {totalUnread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: "var(--accent)", color: "#fff" }}
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
            className="fixed left-4 right-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-11 z-50 sm:w-80 rounded-[20px] border shadow-lg p-4 flex flex-col gap-2"
            style={{
              background: "var(--surface-base)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <p className="text-xs font-semibold px-1 mb-1" style={{ color: "var(--text-secondary)" }}>
              ACTIVITY
            </p>
            {items.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>
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
