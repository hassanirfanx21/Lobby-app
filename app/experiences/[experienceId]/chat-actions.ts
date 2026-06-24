"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export async function getOrCreateDmChannel(experienceId: string, otherUserId: string) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });
  if (!access.has_access) throw new Error("Access denied");
  if (userId === otherUserId) throw new Error("You can't message yourself.");

  const experience = await whopsdk.experiences.retrieve(experienceId);
  const companyId = experience.company.id;

  const dmChannel = await whopsdk.dmChannels.create({
    company_id: companyId,
    with_user_ids: [otherUserId],
  });

  return { channelId: dmChannel.id };
}
