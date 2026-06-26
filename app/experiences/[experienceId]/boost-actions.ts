"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { containsBannedWords } from "@/lib/moderation";

const BOOST_DURATION_MS = 2 * 60 * 60 * 1000;
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

async function promoteExpiredBoosts(experienceId: string) {
  const now = new Date().toISOString();
  const { data: expired } = await supabase
    .from("boosts")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("status", "active")
    .lt("ends_at", now);

  if (expired && expired.length > 0) {
    await supabase.from("boosts").update({ status: "expired" }).in("id", expired.map((b) => b.id));

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

  if (recentBoost && recentBoost.length > 0) {
    return { error: "You can only boost once every 7 days." };
  }

  const whopUser = await whopsdk.users.retrieve(userId);
  await promoteExpiredBoosts(experienceId);

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

  revalidatePath(`/experiences/${experienceId}`);
  return { activatedNow: isSlotFree };
}

export async function getCurrentBoost(experienceId: string) {
  await promoteExpiredBoosts(experienceId);
  const { data } = await supabase
    .from("boosts")
    .select("user_id, name, reason, ends_at")
    .eq("experience_id", experienceId)
    .eq("status", "active")
    .gte("ends_at", new Date().toISOString())
    .maybeSingle();
  return data ?? null;
}
