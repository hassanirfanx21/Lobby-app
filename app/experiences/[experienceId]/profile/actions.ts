"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function saveProfile(formData: FormData) {
  const experienceId = formData.get("experienceId") as string;
  const bio = (formData.get("bio") as string)?.slice(0, 280) ?? "";
  const tags = formData.getAll("tags") as string[];
  const allowMessages = formData.get("allowMessages") === "on";
  const buddyOptIn = formData.get("buddyOptIn") === "on";
  const statusLine = (formData.get("statusLine") as string)?.slice(0, 50) ?? "";

  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });
  if (!access.has_access) {
    throw new Error("Access denied");
  }

  const experience = await whopsdk.experiences.retrieve(experienceId);
  const companyId = experience.company.id;

  let joinedAt: string | null = null;
  for await (const member of whopsdk.members.list({ company_id: companyId })) {
    if (member.user?.id === userId) {
      joinedAt = member.joined_at;
      break;
    }
  }

  const whopUser = await whopsdk.users.retrieve(userId);

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("experience_id", experienceId)
    .eq("user_id", userId)
    .maybeSingle();

  const isFirstTime = !existingProfile;

  const { error } = await supabase.from("profiles").upsert(
    {
      experience_id: experienceId,
      user_id: userId,
      username: whopUser.username,
      name: whopUser.name ?? whopUser.username,
      photo_url: whopUser.profile_picture?.url ?? null,
      bio,
      tags,
      allow_messages: allowMessages,
      buddy_opt_in: buddyOptIn,
      status_line: statusLine,
      joined_at: joinedAt,
    },
    { onConflict: "experience_id,user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (isFirstTime) {
    try {
      let chatChannelId: string | null = null;
      for await (const channel of whopsdk.chatChannels.list({ company_id: companyId })) {
        chatChannelId = channel.id;
        break;
      }
      if (chatChannelId) {
        await whopsdk.messages.create({
          channel_id: chatChannelId,
          content: `👋 **${whopUser.name ?? whopUser.username}** just joined Lobby! Check out their profile and say hi.`,
        });
      }
    } catch (err) {
      console.error("Say-hi chat post failed:", err);
    }
  }

  revalidatePath(`/experiences/${experienceId}`);
  revalidatePath(`/experiences/${experienceId}/profile`);
}