"use client";

import { useEffect, useState } from "react";

type WeeklyPoint = {
  weekStart: string;
  label: string;
  newProfiles: number;
  waves: number;
};

type TagPoint = { label: string; count: number };

type CompletionStats = {
  withBio: number;
  withTags: number;
  withPhoto: number;
  openToChat: number;
  buddyOptIn: number;
  total: number;
  activeToday: number;
  activeThisWeek: number;
  inactive: number;
};


function Bar({
  value,
  max,
  color,
  label,
  sublabel,
  isLoaded,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  sublabel?: string;
  isLoaded?: boolean;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-medium truncate pr-2" style={{ color: "var(--text-primary)" }}>
          {label}
        </span>
        <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
          {sublabel ?? value}
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: (isLoaded ?? true) ? `${pct}%` : "0%", background: color }}
        />
      </div>
    </div>
  );
}

export default function InsightsCharts({
  weeklyData,
  stats,
  topTags,
}: {
  weeklyData: WeeklyPoint[];
  stats: CompletionStats;
  topTags: TagPoint[];
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations right after mount
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const maxProfiles = Math.max(...weeklyData.map((w) => w.newProfiles), 1);
  const maxWaves = Math.max(...weeklyData.map((w) => w.waves), 1);
  const maxTag = topTags.length > 0 ? topTags[0].count : 1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

      {/* ── Weekly Trend ─────────────────────────────────── */}
      <div
        className="lobby-card sm:col-span-2 rounded-[20px] p-5 border transition-all duration-300 hover:shadow-sm"
        style={{ animationDelay: "0.3s", background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
      >
        <p className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "var(--text-tertiary)" }}>
          4-Week Trend
        </p>

        <p className="text-[11px] font-semibold mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
          NEW PROFILES
        </p>
        <div className="flex flex-col gap-2.5 mb-6">
          {weeklyData.map((w) => (
            <div key={w.weekStart} className="flex items-center gap-3">
              <span className="text-[11px] w-16 shrink-0 text-right" style={{ color: "var(--text-tertiary)" }}>
                {w.label}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: isLoaded ? `${maxProfiles > 0 ? Math.round((w.newProfiles / maxProfiles) * 100) : 0}%` : "0%",
                    background: "var(--status-active)",
                  }}
                />
              </div>
              <span className="text-[11px] w-4 text-right shrink-0 font-semibold" style={{ color: "var(--text-secondary)" }}>
                {w.newProfiles}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] font-semibold mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>
          WAVES SENT
        </p>
        <div className="flex flex-col gap-2.5">
          {weeklyData.map((w) => (
            <div key={w.weekStart} className="flex items-center gap-3">
              <span className="text-[11px] w-16 shrink-0 text-right" style={{ color: "var(--text-tertiary)" }}>
                {w.label}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: isLoaded ? `${maxWaves > 0 ? Math.round((w.waves / maxWaves) * 100) : 0}%` : "0%",
                    background: "var(--accent)",
                  }}
                />
              </div>
              <span className="text-[11px] w-4 text-right shrink-0 font-semibold" style={{ color: "var(--text-secondary)" }}>
                {w.waves}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Tags ─────────────────────────────────────── */}
      <div
        className="lobby-card rounded-[20px] p-5 border transition-all duration-300 hover:shadow-sm"
        style={{ animationDelay: "0.4s", background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
      >
        <p className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "var(--text-tertiary)" }}>
          Top Tags
        </p>
        {topTags.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No tags yet.</p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {topTags.map((tag) => (
              <Bar
                key={tag.label}
                value={tag.count}
                max={maxTag}
                color="var(--status-open)"
                label={tag.label}
                sublabel={`${tag.count} member${tag.count !== 1 ? "s" : ""}`}
                isLoaded={isLoaded}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Profile Completion Breakdown ─────────────────── */}
      <div
        className="lobby-card rounded-[20px] p-5 border transition-all duration-300 hover:shadow-sm"
        style={{ animationDelay: "0.5s", background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
      >
        <p className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "var(--text-tertiary)" }}>
          Profile Depth
        </p>
        <div className="flex flex-col gap-3.5">
          <Bar value={stats.withPhoto} max={stats.total} color="var(--status-active)" label="Has photo" sublabel={`${stats.total > 0 ? Math.round(stats.withPhoto / stats.total * 100) : 0}%`} isLoaded={isLoaded} />
          <Bar value={stats.withBio} max={stats.total} color="var(--status-active)" label="Has bio" sublabel={`${stats.total > 0 ? Math.round(stats.withBio / stats.total * 100) : 0}%`} isLoaded={isLoaded} />
          <Bar value={stats.withTags} max={stats.total} color="var(--status-active)" label="Has tags" sublabel={`${stats.total > 0 ? Math.round(stats.withTags / stats.total * 100) : 0}%`} isLoaded={isLoaded} />
          <Bar value={stats.buddyOptIn} max={stats.total} color="var(--accent)" label="Buddy opt-in" sublabel={`${stats.total > 0 ? Math.round(stats.buddyOptIn / stats.total * 100) : 0}%`} isLoaded={isLoaded} />
          <Bar value={stats.openToChat} max={stats.total} color="var(--status-open)" label="Open to chat" sublabel={`${stats.total > 0 ? Math.round(stats.openToChat / stats.total * 100) : 0}%`} isLoaded={isLoaded} />
        </div>
      </div>

      {/* ── Activity Segments ────────────────────────────── */}
      <div
        className="lobby-card sm:col-span-2 rounded-[20px] p-5 border transition-all duration-300 hover:shadow-sm"
        style={{ animationDelay: "0.6s", background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
      >
        <p className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "var(--text-tertiary)" }}>
          Member Activity Segments
        </p>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: "Active Today", value: stats.activeToday, color: "var(--status-active)", icon: "🟢" },
            { label: "Active This Week", value: stats.activeThisWeek, color: "var(--status-open)", icon: "🔵" },
            { label: "Inactive 7d+", value: stats.inactive, color: "var(--text-tertiary)", icon: "⚫" },
          ].map((seg) => (
            <div key={seg.label} className="text-center p-3 rounded-[14px]" style={{ background: "var(--surface-sunken)" }}>
              <p className="text-xl mb-1">{seg.icon}</p>
              <p className="text-xl font-bold" style={{ color: seg.color, fontFamily: "var(--font-jakarta)" }}>
                {seg.value}
              </p>
              <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "var(--text-tertiary)" }}>
                {seg.label}
              </p>
            </div>
          ))}
        </div>
        {/* Stacked bar */}
        {stats.total > 0 && (
          <div>
            <p className="text-[11px] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
              Retention breakdown — all {stats.total} members
            </p>
            <div className="w-full h-3 rounded-full overflow-hidden flex">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{ width: isLoaded ? `${Math.round(stats.activeToday / stats.total * 100)}%` : "0%", background: "var(--status-active)" }}
                title={`Today: ${stats.activeToday}`}
              />
              <div
                className="h-full transition-all duration-1000 ease-out delay-100"
                style={{ width: isLoaded ? `${Math.round((stats.activeThisWeek - stats.activeToday) / stats.total * 100)}%` : "0%", background: "var(--status-open)" }}
                title={`This week: ${stats.activeThisWeek - stats.activeToday}`}
              />
              <div
                className="h-full flex-1 transition-all duration-700"
                style={{ background: "var(--surface-sunken)" }}
                title={`Inactive: ${stats.inactive}`}
              />
            </div>
            <div className="flex gap-4 mt-2">
              {[
                { color: "var(--status-active)", label: "Today" },
                { color: "var(--status-open)", label: "This week" },
                { color: "var(--surface-sunken)", label: "Inactive", border: true },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: l.color, border: l.border ? "1px solid var(--border-strong)" : undefined }}
                  />
                  <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
