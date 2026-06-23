"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/notify";

export async function sendWave(experienceId: string, toUserId: string) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });
  if (!access.has_access) throw new Error("Access denied");
  if (userId === toUserId) throw new Error("You can't wave at yourself.");

  const whopUser = await whopsdk.users.retrieve(userId);
  const experience = await whopsdk.experiences.retrieve(experienceId);
  const companyId = experience.company.id;

  const { error } = await supabase.from("waves").insert({
    experience_id: experienceId,
    from_user_id: userId,
    from_name: whopUser.name ?? whopUser.username,
    to_user_id: toUserId,
  });
  if (error) throw new Error(error.message);

  const { data: reverseWave } = await supabase
    .from("waves")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("from_user_id", toUserId)
    .eq("to_user_id", userId)
    .limit(1);

  const isMutual = !!(reverseWave && reverseWave.length > 0);

  await sendPushNotification({
    companyId,
    userIds: [toUserId],
    title: isMutual ? "✨ It's a mutual wave!" : "👋 Someone waved at you",
    content: isMutual
      ? `You and ${whopUser.name ?? whopUser.username} waved at each other on Lobby!`
      : `${whopUser.name ?? whopUser.username} waved at you on Lobby. Wave back?`,
  });

  revalidatePath(`/experiences/${experienceId}`);
  return { isMutual };
}

export async function dismissWaves(experienceId: string) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  await supabase
    .from("waves")
    .update({ seen: true })
    .eq("experience_id", experienceId)
    .eq("to_user_id", userId)
    .eq("seen", false);
  revalidatePath(`/experiences/${experienceId}`);
}
