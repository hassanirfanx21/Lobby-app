import { whopsdk } from "./whop-sdk";

export async function getCompanyAdminUserIds(companyId: string): Promise<string[]> {
  const ids: string[] = [];
  try {
    for await (const au of whopsdk.authorizedUsers.list({ company_id: companyId })) {
      if (au.user?.id) ids.push(au.user.id);
    }
  } catch (err) {
    console.error("Failed to list authorized users:", err);
  }
  return ids;
}
