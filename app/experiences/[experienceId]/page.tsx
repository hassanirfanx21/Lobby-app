import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Directory from "./Directory";
import { getWeekLabel } from "@/lib/week";
import BuddyMatchButton from "./BuddyMatchButton";
import BuddyReveal from "./BuddyReveal";
import DigestButton from "./DigestButton";
import WelcomeAndTutorial from "./WelcomeAndTutorial";
import { getCurrentBoost } from "./boost-actions";
import BoostButton from "./BoostButton";
import OpenToChatToggle from "./OpenToChatToggle";
import BoostSpotlight from "./BoostSpotlight";
import NotificationBell from "./NotificationBell";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

  if (!access.has_access) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <p style={{ color: "var(--text-secondary)" }}>
          You don't have access to this community.
        </p>
      </div>
    );
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("experience_id", experienceId)
    .eq("user_id", userId)
    .maybeSingle();

  // Keep name/photo fresh from Whop, and mark activity, in one combined update
  if (myProfile) {
    const liveUser = await whopsdk.users.retrieve(userId);
    const liveName = liveUser.name ?? liveUser.username;
    const livePhoto = liveUser.profile_picture?.url ?? null;

    await supabase
      .from("profiles")
      .update({
        name: liveName,
        photo_url: livePhoto,
        username: liveUser.username,
        last_active_at: new Date().toISOString(),
      })
      .eq("id", myProfile.id);

    myProfile.name = liveName;
    myProfile.photo_url = livePhoto;
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const viewsCutoff =
    myProfile?.views_dismissed_at && myProfile.views_dismissed_at > weekAgo
      ? myProfile.views_dismissed_at
      : weekAgo;
  const weekLabel = getWeekLabel();

  const [
    { data: profiles, error },
    { data: incomingWaves },
    { data: profileViews },
    { data: myMatch },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("experience_id", experienceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("waves")
      .select("from_user_id, from_name, from_username, created_at")
      .eq("experience_id", experienceId)
      .eq("to_user_id", userId)
      .eq("seen", false)
      .gte("created_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("profile_views")
      .select("viewer_user_id, viewer_name, created_at")
      .eq("experience_id", experienceId)
      .eq("viewed_user_id", userId)
      .gte("created_at", viewsCutoff),
    supabase
      .from("buddy_matches")
      .select("*")
      .eq("experience_id", experienceId)
      .eq("week_label", weekLabel)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .maybeSingle(),
  ]);

  const buddyName = myMatch
    ? myMatch.user_id_1 === userId
      ? myMatch.name_2
      : myMatch.name_1
    : null;

  const currentBoost = await getCurrentBoost(experienceId);
  const isAdmin = access.access_level === "admin";

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "var(--surface-base)" }}>
      <div className="max-w-5xl mx-auto">

        {/* ── FRONT DESK ───────────────────────────────────── */}
        <div
          className="rounded-2xl mb-5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: "var(--accent-soft)", border: "1px solid var(--border-subtle)" }}
        >
          {/* Avatar + name section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {myProfile?.photo_url ? (
              <img
                src={myProfile.photo_url}
                alt={myProfile.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
                style={{ boxShadow: "0 0 0 2.5px var(--accent)" }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full shrink-0" style={{ background: "var(--border-subtle)" }} />
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-jakarta)" }}>
                {myProfile?.name ?? "Welcome to Lobby"}
              </p>
              {myProfile?.status_line && (
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{myProfile.status_line}</p>
              )}
            </div>
          </div>

          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-2">
            {myProfile && <BoostButton experienceId={experienceId} />}
            {myProfile && (
              <OpenToChatToggle
                experienceId={experienceId}
                initialOpen={!!myProfile?.open_to_chat}
              />
            )}
            <Link
              href={`/experiences/${experienceId}/profile`}
              prefetch={false}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition hover:opacity-80"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              {myProfile ? "Edit profile" : "Fill profile"}
            </Link>
            {/* Notification bell */}
            <NotificationBell
              waves={incomingWaves ?? []}
              views={profileViews ?? []}
              experienceId={experienceId}
            />
          </div>
        </div>

        {/* ── WELCOME ──────────────────────────────────────── */}
        <WelcomeAndTutorial experienceId={experienceId} hasProfile={!!myProfile} />

        {/* ── SPOTLIGHT TICKER ─────────────────────────────── */}
        {currentBoost && (
          <BoostSpotlight experienceId={experienceId} boost={currentBoost} isAdmin={isAdmin} />
        )}

        {/* ── ADMIN TOOLS ──────────────────────────────────── */}
        {isAdmin && <BuddyMatchButton experienceId={experienceId} />}
        {isAdmin && <DigestButton experienceId={experienceId} />}

        {/* ── BUDDY REVEAL ─────────────────────────────────── */}
        {buddyName && <BuddyReveal buddyName={buddyName} />}

        {/* ── NO-PROFILE NUDGE ─────────────────────────────── */}
        {!myProfile && (
          <div
            className="mb-5 rounded-xl p-4 text-sm border"
            style={{ background: "var(--accent-soft)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
          >
            You haven't added yourself yet — fill your profile so others can find you.
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────── */}
        {error && (
          <div className="mb-5 rounded-xl p-4 text-sm border border-red-300 bg-red-50 text-red-700">
            Couldn't load the directory right now. Try refreshing.
          </div>
        )}

        {/* ── DIRECTORY ────────────────────────────────────── */}
        <Directory
          profiles={profiles ?? []}
          currentUserId={userId}
          experienceId={experienceId}
          isAdmin={isAdmin}
          boostedUserId={currentBoost?.user_id ?? null}
        />
      </div>
    </div>
  );
}
