import { whopsdk } from "@/lib/whop-sdk";
import { setBillingPlan } from "@/app/experiences/[experienceId]/billing-actions";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headers = Object.fromEntries(request.headers);
  const event = whopsdk.webhooks.unwrap(body, { headers });

  let experienceId: string | undefined;
  if (event.type === "payment.succeeded") {
    experienceId = event.data.metadata?.experience_id as string | undefined;
    if (experienceId) {
      await setBillingPlan(experienceId, "pro");
    }
  } else if (event.type === "membership.deactivated") {
    experienceId = event.data.metadata?.experience_id as string | undefined;
    if (experienceId) {
      await setBillingPlan(experienceId, "free");
    }
  }

  return new Response("OK", { status: 200 });
}
