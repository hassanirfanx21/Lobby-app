"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function dismissProfileViews(experienceId: string) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  await supabase
    .from("profiles")
    .update({ views_dismissed_at: new Date().toISOString() })
    .eq("experience_id", experienceId)
    .eq("user_id", userId);
  revalidatePath(`/experiences/${experienceId}`);
}
