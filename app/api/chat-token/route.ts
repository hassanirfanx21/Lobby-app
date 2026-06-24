import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(req: Request) {
  const { experienceId } = await req.json();
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const access = await whopsdk.users.checkAccess(experienceId, { id: userId });
  if (!access.has_access) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const experience = await whopsdk.experiences.retrieve(experienceId);
  const companyId = experience.company.id;

  const { token } = await whopsdk.accessTokens.create({
    company_id: companyId,
    user_id: userId,
    scoped_actions: ["dms:read", "dms:message:manage", "dms:channel:manage"],
  });

  return NextResponse.json({ token });
}
