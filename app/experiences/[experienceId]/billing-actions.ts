"use server";

import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { getCompanyAdminUserIds } from "@/lib/admins";
import { sendPushNotification } from "@/lib/notify";

const FREE_LIMIT = 50;

export async function getBillingStatus(experienceId: string) {
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("experience_id", experienceId);

  const { data } = await supabase
    .from("billing_status")
    .select("plan")
    .eq("experience_id", experienceId)
    .maybeSingle();

  const plan = data?.plan ?? "free";
  const profileCount = count ?? 0;

  return { plan, profileCount, isPro: plan === "pro" };
}

export async function canCreateNewProfile(experienceId: string, userId: string) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return { allowed: true };

  const { plan, profileCount } = await getBillingStatus(experienceId);
  if (plan === "pro") return { allowed: true };

  if (profileCount >= FREE_LIMIT) {
    await notifyAdminsOfLimit(experienceId, profileCount);
    return {
      allowed: false,
      message:
        "This community has reached Lobby's free member limit (50 profiles). Ask the community owner to upgrade to Lobby Pro to add more.",
    };
  }

  return { allowed: true };
}

async function notifyAdminsOfLimit(experienceId: string, profileCount: number) {
  const { data } = await supabase
    .from("billing_status")
    .select("threshold_notified_at")
    .eq("experience_id", experienceId)
    .maybeSingle();

  if (data?.threshold_notified_at) return;

  await supabase.from("billing_status").upsert({
    experience_id: experienceId,
    plan: "free",
    threshold_notified_at: new Date().toISOString(),
  });

  const experience = await whopsdk.experiences.retrieve(experienceId);
  const companyId = experience.company.id;
  const adminUserIds = await getCompanyAdminUserIds(companyId);

  if (adminUserIds.length === 0) return;

  await sendPushNotification({
    companyId,
    userIds: adminUserIds,
    title: "Lobby has hit its free limit",
    content: `${profileCount} members have tried to join. New profiles are paused until you upgrade to Lobby Pro ($19/mo).`,
  });
}

export async function createUpgradeCheckout(experienceId: string, returnUrl: string) {
  const checkout = await whopsdk.checkoutConfigurations.create({
    plan_id: process.env.LOBBY_PRO_PLAN_ID!,
    metadata: { experience_id: experienceId },
    redirect_url: returnUrl,
  });
  return checkout.purchase_url;
}

export async function setBillingPlan(experienceId: string, plan: "free" | "pro") {
  const payload: Record<string, unknown> = { experience_id: experienceId, plan };
  if (plan === "pro") {
    payload.upgraded_at = new Date().toISOString();
    payload.threshold_notified_at = null;
  } else {
    payload.upgraded_at = null;
  }
  await supabase.from("billing_status").upsert(payload, { onConflict: "experience_id" });
}
