import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import ProfileForm from "./ProfileForm";
import { getTagOptions } from "../tag-actions";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

  if (!access.has_access) {
    return <div className="p-6">Access denied</div>;
  }

  const whopUser = await whopsdk.users.retrieve(userId);

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("experience_id", experienceId)
    .eq("user_id", userId)
    .maybeSingle();

  const [availableInterestTags, availableCoordinationTags] = await Promise.all([
    getTagOptions(experienceId, "interest"),
    getTagOptions(experienceId, "coordination"),
  ]);

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--surface-base)" }}>
      <div className="max-w-md mx-auto">
        <ProfileForm
          experienceId={experienceId}
          name={whopUser.name ?? whopUser.username}
          photoUrl={whopUser.profile_picture?.url ?? null}
          initialBio={existing?.bio ?? ""}
          initialTags={existing?.tags ?? []}
          initialAllowMessages={existing?.allow_messages ?? true}
          initialBuddyOptIn={existing?.buddy_opt_in ?? false}
          initialStatusLine={existing?.status_line ?? ""}
          initialCoordinationTags={existing?.coordination_tags ?? []}
          availableTags={availableInterestTags}
          availableCoordinationTags={availableCoordinationTags}
        />
      </div>
    </div>
  );
}
