import { whopsdk } from "./whop-sdk";

export async function sendPushNotification({
  companyId,
  userIds,
  title,
  content,
}: {
  companyId: string;
  userIds: string[];
  title: string;
  content: string;
}) {
  try {
    const result = await whopsdk.notifications.create({
      company_id: companyId,
      user_ids: userIds,
      title,
      content,
    });
    console.log("Push notification result:", result);
  } catch (err) {
    console.error("Push notification failed:", err);
  }
}
