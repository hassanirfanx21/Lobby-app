"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function verifyProfile(experienceId: string, profileId: string, verified: boolean) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

  if (access.access_level !== "admin") {
    throw new Error("Only the community admin can verify members.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_verified: verified })
    .eq("id", profileId)
    .eq("experience_id", experienceId);

  if (error) throw new Error(error.message);

  revalidatePath(`/experiences/${experienceId}`);
}
