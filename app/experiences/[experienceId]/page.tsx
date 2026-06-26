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
import WaveBanner from "./WaveBanner";
import ProfileViewBanner from "./ProfileViewBanner";
import { getCurrentBoost } from "./boost-actions";
import BoostButton from "./BoostButton";
import OpenToChatToggle from "./OpenToChatToggle";
import BoostSpotlight from "./BoostSpotlight";

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
        <p className="text-neutral-500">
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

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Lobby</h1>
          <Link
            href={`/experiences/${experienceId}/profile`}
            prefetch={false}
            className="rounded-full bg-black text-white text-sm px-4 py-2 hover:bg-neutral-800 transition"
          >
            {myProfile ? "Edit my profile" : "Fill your profile"}
          </Link>
        </header>

        <WelcomeAndTutorial experienceId={experienceId} hasProfile={!!myProfile} />

        {myProfile && (
          <div className="flex gap-2 mb-4">
            <BoostButton experienceId={experienceId} />
            <OpenToChatToggle experienceId={experienceId} initialOpen={!!myProfile?.open_to_chat} />
          </div>
        )}

        {currentBoost && (
          <BoostSpotlight experienceId={experienceId} boost={currentBoost} isAdmin={access.access_level === "admin"} />
        )}

        {access.access_level === "admin" && (
          <BuddyMatchButton experienceId={experienceId} />
        )}

        {access.access_level === "admin" && <DigestButton experienceId={experienceId} />}

        {buddyName && <BuddyReveal buddyName={buddyName} />}

        <ProfileViewBanner views={profileViews ?? []} experienceId={experienceId} />

        {incomingWaves && incomingWaves.length > 0 && (
          <WaveBanner waves={incomingWaves ?? []} experienceId={experienceId} />
        )}

        {!myProfile && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You haven't added yourself yet — fill your profile so others can
            find you.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Couldn't load the directory right now. Try refreshing.
          </div>
        )}

        <Directory
          profiles={profiles ?? []}
          currentUserId={userId}
          experienceId={experienceId}
          isAdmin={access.access_level === "admin"}
        />
      </div>
    </div>
  );
}
