import { whopsdk } from "./whop-sdk";

export async function getChatChannelId(companyId: string): Promise<string | null> {
  for await (const channel of whopsdk.chatChannels.list({ company_id: companyId })) {
    return channel.id;
  }
  return null;
}
