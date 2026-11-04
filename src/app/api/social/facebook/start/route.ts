// بداية ربط صفحة فيسبوك: يحوّل إلى نافذة موافقة فيسبوك
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { FB_SCOPES, fbConfigured, fbRedirect } from "@/lib/facebook";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!fbConfigured()) return NextResponse.redirect(new URL("/connect?fb=missing", fbRedirect()));
  const state = randomBytes(16).toString("hex");
  // «Facebook Login for Business» يحتاج config_id بدل قائمة الصلاحيات
  const cfg = process.env.FACEBOOK_CONFIG_ID;
  const params: Record<string, string> = { client_id: process.env.FACEBOOK_APP_ID!, redirect_uri: fbRedirect(), state, response_type: "code" };
  if (cfg) params.config_id = cfg;
  else params.scope = FB_SCOPES;
  const url = `https://www.facebook.com/v21.0/dialog/oauth?${new URLSearchParams(params)}`;
  const res = NextResponse.redirect(url);
  res.cookies.set("fb_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
