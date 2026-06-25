"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

const OPEN_DURATION_MS = 60 * 60 * 1000;

export async function setOpenToChat(experienceId: string, open: boolean) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  await supabase
    .from("profiles")
    .update({
      open_to_chat: open,
      open_to_chat_until: open ? new Date(Date.now() + OPEN_DURATION_MS).toISOString() : null,
    })
    .eq("experience_id", experienceId)
    .eq("user_id", userId);
  revalidatePath(`/experiences/${experienceId}`);
}
