"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { getWeekLabel, getPreviousWeekLabel } from "@/lib/week";
import { sendPushNotification } from "@/lib/notify";

export async function runBuddyMatching(experienceId: string) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });
  if (access.access_level !== "admin") {
    return { error: "Only the community admin can run buddy matching." };
  }

  const experience = await whopsdk.experiences.retrieve(experienceId);
  const companyId = experience.company.id;

  const weekLabel = getWeekLabel();

  const { data: existingMatches } = await supabase
    .from("buddy_matches")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("week_label", weekLabel)
    .limit(1);

  if (existingMatches && existingMatches.length > 0) {
    return { error: "Buddy matching already ran for this week." };
  }

  const { data: candidates, error: fetchError } = await supabase
    .from("profiles")
    .select("user_id, name")
    .eq("experience_id", experienceId)
    .eq("buddy_opt_in", true);

  if (fetchError) return { error: fetchError.message };
  if (!candidates || candidates.length < 2) {
    return { error: "Need at least 2 people opted into Buddy Matching." };
  }

  const previousWeekLabel = getPreviousWeekLabel(weekLabel);
  const { data: previousMatches } = await supabase
    .from("buddy_matches")
    .select("user_id_1, user_id_2")
    .eq("experience_id", experienceId)
    .eq("week_label", previousWeekLabel);

  const previousPairs = new Set(
    (previousMatches ?? []).map((m) => [m.user_id_1, m.user_id_2].sort().join("|"))
  );

  function buildPairs(list: NonNullable<typeof candidates>) {
    const result = [];
    for (let i = 0; i + 1 < list.length; i += 2) {
      result.push({
        experience_id: experienceId,
        user_id_1: list[i].user_id,
        user_id_2: list[i + 1].user_id,
        name_1: list[i].name,
        name_2: list[i + 1].name,
        week_label: weekLabel,
      });
    }
    return result;
  }

  const hasRepeat = (pairs: { user_id_1: string; user_id_2: string }[]) =>
    pairs.some((p) => previousPairs.has([p.user_id_1, p.user_id_2].sort().join("|")));

  let pairs = buildPairs([...candidates].sort(() => Math.random() - 0.5));

  for (let attempt = 0; attempt < 5 && candidates.length > 2 && hasRepeat(pairs); attempt++) {
    pairs = buildPairs([...candidates].sort(() => Math.random() - 0.5));
  }

  const { error: insertError } = await supabase.from("buddy_matches").insert(pairs);
  if (insertError) return { error: insertError.message };

  for (const pair of pairs) {
    await sendPushNotification({
      companyId,
      userIds: [pair.user_id_1, pair.user_id_2],
      title: "🤝 You've got a weekly buddy!",
      content: "Open Lobby to reveal who you're matched with this week.",
    });
  }

  revalidatePath(`/experiences/${experienceId}`);

  return { matched: pairs.length * 2, leftOver: candidates.length % 2 };
}
