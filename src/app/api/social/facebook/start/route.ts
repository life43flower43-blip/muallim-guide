// بداية ربط صفحة فيسبوك: يحوّل إلى نافذة موافقة فيسبوك
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { FB_SCOPES, fbConfigured, fbRedirect } from "@/lib/facebook";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!fbConfigured()) return NextResponse.redirect(new URL("/connect?fb=missing", fbRedirect()));
  const state = randomBytes(16).toString("hex");
  const url = `https://www.facebook.com/v21.0/dialog/oauth?${new URLSearchParams({ client_id: process.env.FACEBOOK_APP_ID!, redirect_uri: fbRedirect(), state, scope: FB_SCOPES, response_type: "code" })}`;
  const res = NextResponse.redirect(url);
  res.cookies.set("fb_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
