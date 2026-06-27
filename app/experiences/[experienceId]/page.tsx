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

  const isMeOpenToChat = () => {
    if (!myProfile?.open_to_chat || !myProfile?.open_to_chat_until) return false;
    return new Date(myProfile.open_to_chat_until).getTime() > Date.now();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "var(--surface-base)" }}>
      <div className="max-w-5xl mx-auto">

        {/* ── FRONT DESK ───────────────────────────────────── */}
        <div
          className="rounded-[20px] mb-8 p-5 sm:p-6 border"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar + info */}
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              {myProfile?.photo_url ? (
                <img
                  src={myProfile.photo_url}
                  alt={myProfile.name}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                  style={{
                    boxShadow: isMeOpenToChat()
                      ? "0 0 0 2.5px var(--status-open)"
                      : "0 0 0 1px var(--border-subtle)",
                  }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-xl font-bold"
                  style={{ background: "var(--surface-sunken)", color: "var(--text-tertiary)" }}
                >
                  👤
                </div>
              )}
              <div className="min-w-0">
                <p
                  className="font-bold text-base truncate flex items-center gap-2"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-jakarta)" }}
                >
                  <span>{myProfile?.name ?? "Welcome to Lobby"}</span>
                  {isMeOpenToChat() && (
                    <span
                      className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded"
                      style={{ background: "var(--status-open)", color: "#fff" }}
                    >
                      CHATTING
                    </span>
                  )}
                </p>
                {myProfile?.status_line && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {myProfile.status_line}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
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
                className="text-xs font-medium px-3 py-2 rounded-[12px] border transition-all duration-200 hover:opacity-80"
                style={{
                  background: "var(--surface-base)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                {myProfile ? "Edit" : "Set up profile"}
              </Link>
              <NotificationBell
                waves={incomingWaves ?? []}
                views={profileViews ?? []}
                experienceId={experienceId}
              />
            </div>
          </div>
        </div>

        {/* ── WELCOME ──────────────────────────────────────── */}
        <WelcomeAndTutorial experienceId={experienceId} hasProfile={!!myProfile} />

        {/* ── SPOTLIGHT TICKER ─────────────────────────────── */}
        {currentBoost && (
          <BoostSpotlight experienceId={experienceId} boost={currentBoost} isAdmin={isAdmin} />
        )}

        {/* ── BUDDY REVEAL ─────────────────────────────────── */}
        {buddyName && <BuddyReveal buddyName={buddyName} />}

        {/* ── NO-PROFILE NUDGE ─────────────────────────────── */}
        {!myProfile && (
          <div
            className="mb-8 rounded-[16px] p-4 text-sm border flex items-center gap-3"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <span className="text-xl">📝</span>
            <span>
              You haven&apos;t added yourself yet —{" "}
              <Link
                href={`/experiences/${experienceId}/profile`}
                className="font-semibold underline"
                style={{ color: "var(--accent)" }}
              >
                fill your profile
              </Link>{" "}
              so others can find you.
            </span>
          </div>
        )}

        {/* ── ADMIN PANEL ──────────────────────────────────── */}
        {isAdmin && (
          <div
            className="mb-8 rounded-[16px] p-4 border"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              Admin Tools
            </p>
            <div className="flex flex-wrap gap-2">
              <BuddyMatchButton experienceId={experienceId} />
              <DigestButton experienceId={experienceId} />
            </div>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────── */}
        {error && (
          <div
            className="mb-8 rounded-[16px] p-4 text-sm border"
            style={{
              background: "var(--surface-raised)",
              borderColor: "var(--error)",
              color: "var(--error)",
            }}
          >
            Couldn&apos;t load the directory right now. Try refreshing.
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
