"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { containsBannedWords } from "@/lib/moderation";
import { sendPushNotification } from "@/lib/notify";
import { getCompanyAdminUserIds } from "@/lib/admins";

const BOOST_DURATION_MS = 2 * 60 * 60 * 1000;
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

async function expireOldBoosts(experienceId: string) {
  await supabase
    .from("boosts")
    .update({ status: "expired" })
    .eq("experience_id", experienceId)
    .eq("status", "active")
    .lt("ends_at", new Date().toISOString());
}

async function promoteNextIfFree(experienceId: string) {
  const { data: active } = await supabase
    .from("boosts")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("status", "active")
    .gte("ends_at", new Date().toISOString())
    .limit(1);

  if (active && active.length > 0) return;

  const { data: nextQueued } = await supabase
    .from("boosts")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1);

  if (nextQueued && nextQueued.length > 0) {
    const start = new Date();
    await supabase
      .from("boosts")
      .update({
        status: "active",
        started_at: start.toISOString(),
        ends_at: new Date(start.getTime() + BOOST_DURATION_MS).toISOString(),
      })
      .eq("id", nextQueued[0].id);
  }
}

export async function requestBoost(experienceId: string, reason: string) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });
  if (!access.has_access) throw new Error("Access denied");

  const cleanReason = reason.trim().slice(0, 100);
  if (!cleanReason) return { error: "Tell the group why you're boosting." };
  if (containsBannedWords(cleanReason)) {
    return { error: "That message isn't appropriate for the community. Please rephrase." };
  }

  const { data: recentBoost } = await supabase
    .from("boosts")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - COOLDOWN_MS).toISOString())
    .limit(1);
  if (recentBoost && recentBoost.length > 0) return { error: "You can only boost once every 7 days." };

  const whopUser = await whopsdk.users.retrieve(userId);
  const experience = await whopsdk.experiences.retrieve(experienceId);
  const companyId = experience.company.id;

  await expireOldBoosts(experienceId);
  await promoteNextIfFree(experienceId);

  const { data: active } = await supabase
    .from("boosts")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("status", "active")
    .gte("ends_at", new Date().toISOString())
    .limit(1);

  const isSlotFree = !active || active.length === 0;
  const now = new Date();

  const { error } = await supabase.from("boosts").insert({
    experience_id: experienceId,
    user_id: userId,
    name: whopUser.name ?? whopUser.username,
    reason: cleanReason,
    status: isSlotFree ? "active" : "queued",
    started_at: isSlotFree ? now.toISOString() : null,
    ends_at: isSlotFree ? new Date(now.getTime() + BOOST_DURATION_MS).toISOString() : null,
  });
  if (error) return { error: error.message };

  const adminIds = await getCompanyAdminUserIds(companyId);
  if (adminIds.length > 0) {
    await sendPushNotification({
      companyId,
      userIds: adminIds,
      title: isSlotFree ? "🚀 New boost on Lobby" : "🚀 New boost queued on Lobby",
      content: `${whopUser.name ?? whopUser.username} boosted: "${cleanReason}"`,
    });
  }

  revalidatePath(`/experiences/${experienceId}`);
  return { activatedNow: isSlotFree };
}

export async function cancelBoost(experienceId: string, boostId: string) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });
  if (access.access_level !== "admin") throw new Error("Only the community admin can remove a boost.");

  await supabase.from("boosts").update({ status: "removed" }).eq("id", boostId).eq("experience_id", experienceId);
  await promoteNextIfFree(experienceId);
  revalidatePath(`/experiences/${experienceId}`);
}

export async function getCurrentBoost(experienceId: string) {
  await expireOldBoosts(experienceId);
  await promoteNextIfFree(experienceId);
  const { data } = await supabase
    .from("boosts")
    .select("id, user_id, name, reason, ends_at")
    .eq("experience_id", experienceId)
    .eq("status", "active")
    .gte("ends_at", new Date().toISOString())
    .maybeSingle();
  return data ?? null;
}
