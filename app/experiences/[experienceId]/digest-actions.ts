"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";
import { getChatChannelId } from "@/lib/chat";

export async function postWeeklyDigest(experienceId: string) {
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });
  if (access.access_level !== "admin") throw new Error("Only the community admin can post the digest.");

  const experience = await whopsdk.experiences.retrieve(experienceId);
  const companyId = experience.company.id;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: newProfiles } = await supabase
    .from("profiles").select("tags").eq("experience_id", experienceId).gte("created_at", weekAgo);
  const { data: matchesThisWeek } = await supabase
    .from("buddy_matches").select("id").eq("experience_id", experienceId).gte("created_at", weekAgo);

  const tagCounts: Record<string, number> = {};
  for (const p of newProfiles ?? []) for (const t of p.tags ?? []) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  const trendingTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const chatChannelId = await getChatChannelId(companyId);
  if (!chatChannelId) throw new Error("No chat channel found to post into.");

  const lines = [
    `📊 **This week in Lobby:**`,
    `• ${newProfiles?.length ?? 0} new profiles`,
    `• ${matchesThisWeek?.length ?? 0} buddy matches`,
  ];
  if (trendingTag) lines.push(`• 🔥 Trending tag: ${trendingTag}`);

  await whopsdk.messages.create({ channel_id: chatChannelId, content: lines.join("\n") });
  return { posted: true };
}
