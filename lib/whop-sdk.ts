import Whop from "@whop/sdk";

export const whopsdk = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  webhookKey: btoa(process.env.WHOP_WEBHOOK_SECRET || ""),
});