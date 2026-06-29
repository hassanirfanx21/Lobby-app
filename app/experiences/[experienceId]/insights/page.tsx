import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { getWeekLabel } from "@/lib/week";
import InsightsCharts from "./InsightsCharts";
import { getBillingStatus } from "../billing-actions";
import { UpgradeBanner } from "../UpgradeBanner";

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

  if (!access.has_access || access.access_level !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen p-6" style={{ background: "var(--surface-base)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Admin access required.</p>
      </div>
    );
  }

  const { isPro, profileCount } = await getBillingStatus(experienceId);
  if (!isPro) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ background: "var(--surface-base)" }}>
        <div className="max-w-xl rounded-[24px] p-8 text-center" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)", fontFamily: "var(--font-jakarta)" }}>
            Insights is a Lobby Pro feature
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Your community has {profileCount} active profiles. Upgrade to see completion rates, weekly trends, and engagement data.
          </p>
          <UpgradeBanner experienceId={experienceId} profileCount={profileCount} />
        </div>
      </div>
    );
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekLabel = getWeekLabel();

  // ── Fetch everything in parallel ────────────────────────────────────────────
  const [
    { data: allProfiles },
    { data: wavesThisWeek },
    { data: boostsThisWeek },
    { data: matchesThisWeek },
    { data: viewsThisWeek },
    { data: recentWaves },     // 4 weeks for trend
    { data: recentProfiles },  // 4 weeks for trend
    { data: recentMatches },   // for trend
  ] = await Promise.all([
    supabase.from("profiles").select("id, user_id, bio, tags, coordination_tags, buddy_opt_in, last_active_at, open_to_chat, open_to_chat_until, created_at, name, photo_url").eq("experience_id", experienceId),
    supabase.from("waves").select("id, created_at").eq("experience_id", experienceId).gte("created_at", weekAgo),
    supabase.from("boosts").select("id, created_at").eq("experience_id", experienceId).gte("created_at", weekAgo),
    supabase.from("buddy_matches").select("id, week_label").eq("experience_id", experienceId).eq("week_label", weekLabel),
    supabase.from("profile_views").select("id, created_at").eq("experience_id", experienceId).gte("created_at", weekAgo),
    supabase.from("waves").select("created_at").eq("experience_id", experienceId).gte("created_at", fourWeeksAgo),
    supabase.from("profiles").select("created_at").eq("experience_id", experienceId).gte("created_at", fourWeeksAgo),
    supabase.from("buddy_matches").select("created_at, week_label").eq("experience_id", experienceId).gte("created_at", fourWeeksAgo),
  ]);

  const profiles = allProfiles ?? [];
  const total = profiles.length;

  // ── Profile completion stats ─────────────────────────────────────────────────
  const withBio = profiles.filter(p => p.bio && p.bio.trim().length > 10).length;
  const withTags = profiles.filter(p => p.tags && p.tags.length > 0).length;
  const withPhoto = profiles.filter(p => !!p.photo_url).length;
  const buddyOptIn = profiles.filter(p => p.buddy_opt_in).length;
  const openToChat = profiles.filter(p => {
    if (!p.open_to_chat || !p.open_to_chat_until) return false;
    return new Date(p.open_to_chat_until).getTime() > now.getTime();
  }).length;

  // A "complete" profile = has bio + at least 1 tag
  const completeProfiles = profiles.filter(p => p.bio && p.bio.trim().length > 10 && p.tags && p.tags.length > 0).length;
  const completionRate = total > 0 ? Math.round((completeProfiles / total) * 100) : 0;

  // ── Activity segmentation ─────────────────────────────────────────────────────
  const activeToday = profiles.filter(p => p.last_active_at && p.last_active_at > dayAgo).length;
  const activeThisWeek = profiles.filter(p => p.last_active_at && p.last_active_at > weekAgo).length;
  const inactive = total - activeThisWeek;

  // ── Top 5 most active members ────────────────────────────────────────────────
  const topActive = [...profiles]
    .filter(p => p.last_active_at)
    .sort((a, b) => new Date(b.last_active_at!).getTime() - new Date(a.last_active_at!).getTime())
    .slice(0, 5);

  // ── Top tags ─────────────────────────────────────────────────────────────────
  const tagCount = new Map<string, number>();
  for (const p of profiles) {
    for (const t of p.tags ?? []) {
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
    for (const t of p.coordination_tags ?? []) {
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
  }
  const topTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([label, count]) => ({ label, count }));

  // ── Weekly trend (last 4 weeks) ───────────────────────────────────────────────
  // Build week buckets: Week -3, -2, -1, Current
  function getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setUTCDate(d.getUTCDate() + diff);
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }

  const weekStarts: string[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weekStarts.push(getWeekStart(d));
  }

  const weeklyData = weekStarts.map((wStart, idx) => {
    const wEnd = idx < weekStarts.length - 1
      ? weekStarts[idx + 1]
      : new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

    const newProfiles = (recentProfiles ?? []).filter(p => {
      const d = p.created_at.slice(0, 10);
      return d >= wStart && d < wEnd;
    }).length;

    const waves = (recentWaves ?? []).filter(w => {
      const d = w.created_at.slice(0, 10);
      return d >= wStart && d < wEnd;
    }).length;

    const label = idx === weekStarts.length - 1 ? "This week" : `Week -${weekStarts.length - 1 - idx}`;

    return { weekStart: wStart, label, newProfiles, waves };
  });

  const stats = {
    total,
    completionRate,
    withBio,
    withTags,
    withPhoto,
    buddyOptIn,
    openToChat,
    activeToday,
    activeThisWeek,
    inactive,
    wavesThisWeek: wavesThisWeek?.length ?? 0,
    boostsThisWeek: boostsThisWeek?.length ?? 0,
    matchesThisWeek: (matchesThisWeek?.length ?? 0) * 2,
    viewsThisWeek: viewsThisWeek?.length ?? 0,
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "var(--surface-base)" }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href={`/experiences/${experienceId}`}
              className="inline-flex items-center gap-2 text-sm font-medium mb-3 transition-opacity hover:opacity-70"
              style={{ color: "var(--text-secondary)" }}
            >
              ← Back
            </Link>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-jakarta)" }}
            >
              Community Insights
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              Admin-only · Updated live
            </p>
          </div>
          <div
            className="text-4xl"
            title="Admin-only dashboard"
          >
            📊
          </div>
        </div>

        {/* ── Headline KPIs ───────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Members", value: stats.total, sub: "in directory", icon: "👥" },
            { label: "Profile Completion", value: `${stats.completionRate}%`, sub: "have bio + tag", icon: "✅", accent: stats.completionRate >= 60 },
            { label: "Active This Week", value: stats.activeThisWeek, sub: "visited Lobby", icon: "🟢" },
            { label: "Buddy Opt-In", value: stats.buddyOptIn, sub: `of ${stats.total} members`, icon: "🤝" },
          ].map((kpi, idx) => (
            <div
              key={kpi.label}
              className="lobby-card rounded-[20px] p-4 sm:p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{
                animationDelay: `${idx * 0.05}s`,
                background: "var(--surface-raised)",
                borderColor: kpi.accent ? "var(--status-active)" : "var(--border-subtle)",
              }}
            >
              <div className="text-2xl mb-2">{kpi.icon}</div>
              <p
                className="text-2xl sm:text-3xl font-bold"
                style={{
                  color: kpi.accent ? "var(--status-active)" : "var(--text-primary)",
                  fontFamily: "var(--font-jakarta)",
                }}
              >
                {kpi.value}
              </p>
              <p className="text-[11px] font-semibold mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                {kpi.label}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── This Week Activity ──────────────────────────── */}
        <div
          className="lobby-card rounded-[20px] p-5 border mb-6 transition-all duration-300 hover:shadow-sm"
          style={{ animationDelay: "0.2s", background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--text-tertiary)" }}>
            This Week's Activity
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Waves Sent", value: stats.wavesThisWeek, icon: "👋" },
              { label: "Profile Views", value: stats.viewsThisWeek, icon: "👀" },
              { label: "Boosts Used", value: stats.boostsThisWeek, icon: "🚀" },
              { label: "Buddies Matched", value: stats.matchesThisWeek, icon: "🤝" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-3xl mb-1">{item.icon}</p>
                <p className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-jakarta)" }}>
                  {item.value}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Charts row ──────────────────────────────────── */}
        <InsightsCharts
          weeklyData={weeklyData}
          stats={{
            withBio,
            withTags,
            withPhoto,
            openToChat,
            buddyOptIn,
            total,
            activeToday,
            activeThisWeek,
            inactive,
          }}
          topTags={topTags}
        />

        {/* ── Most Active Members ─────────────────────────── */}
        <div
          className="lobby-card rounded-[20px] p-5 border transition-all duration-300 hover:shadow-sm"
          style={{ animationDelay: "0.7s", background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--text-tertiary)" }}>
            Most Recently Active Members
          </p>
          {topActive.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No activity data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <th className="pb-3 text-[10px] font-bold tracking-widest uppercase w-12" style={{ color: "var(--text-tertiary)" }}>#</th>
                    <th className="pb-3 text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-tertiary)" }}>Member</th>
                    <th className="pb-3 text-[10px] font-bold tracking-widest uppercase w-32" style={{ color: "var(--text-tertiary)" }}>Last Active</th>
                    <th className="pb-3 text-[10px] font-bold tracking-widest uppercase text-right w-40" style={{ color: "var(--text-tertiary)" }}>Tags & Goals</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {topActive.map((p, i) => {
                    const mins = Math.floor((now.getTime() - new Date(p.last_active_at!).getTime()) / 60000);
                    const label =
                      mins < 2 ? "Just now" :
                      mins < 60 ? `${mins}m ago` :
                      mins < 1440 ? `${Math.floor(mins / 60)}h ago` :
                      `${Math.floor(mins / 1440)}d ago`;

                    const isOpen = p.open_to_chat && p.open_to_chat_until && new Date(p.open_to_chat_until).getTime() > now.getTime();

                    return (
                      <tr key={p.id} className="group hover:bg-[var(--surface-sunken)] transition-colors duration-150">
                        {/* Rank */}
                        <td className="py-3.5 text-sm font-semibold" style={{ color: "var(--text-tertiary)" }}>
                          {i + 1}
                        </td>
                        {/* User Info */}
                        <td className="py-3.5">
                          <Link
                            href={`/experiences/${experienceId}/u/${p.user_id}`}
                            className="flex items-center gap-3 w-fit"
                          >
                            {p.photo_url ? (
                              <img src={p.photo_url} alt={p.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                                style={{ background: "var(--surface-sunken)", color: "var(--text-tertiary)" }}
                              >
                                {p.name?.charAt(0)?.toUpperCase() ?? "?"}
                              </div>
                            )}
                            <span className="text-sm font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
                              {p.name}
                            </span>
                          </Link>
                        </td>
                        {/* Last Active */}
                        <td className="py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <span className="flex items-center gap-1.5">
                            {mins < 10 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--status-active)" }} />}
                            {label}
                          </span>
                        </td>
                        {/* Badges/Indicators */}
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isOpen && (
                              <span
                                className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded"
                                style={{ background: "var(--status-open)", color: "#fff" }}
                              >
                                CHAT
                              </span>
                            )}
                            {p.buddy_opt_in && (
                              <span
                                className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded border"
                                style={{
                                  background: "var(--surface-sunken)",
                                  borderColor: "var(--border-strong)",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                BUDDY
                              </span>
                            )}
                            {p.tags && p.tags.length > 0 && (
                              <span
                                className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded"
                                style={{
                                  background: "var(--accent-soft)",
                                  color: "var(--accent)",
                                }}
                              >
                                {p.tags[0]}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
