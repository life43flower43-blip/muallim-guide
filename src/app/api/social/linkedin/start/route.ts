// بداية ربط لينكدإن: يحوّل إلى نافذة موافقة لينكدإن
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { randomBytes } from "crypto";
import { LI_SCOPES, liConfigured, liRedirect } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

export async function GET() {
  // لصاحب الموقع فقط
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/connect", liRedirect()), 303);
  if (!liConfigured()) return NextResponse.redirect(new URL("/connect?li=missing", liRedirect()));
  const state = randomBytes(16).toString("hex");
  const url = `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({ response_type: "code", client_id: process.env.LINKEDIN_CLIENT_ID!, redirect_uri: liRedirect(), state, scope: LI_SCOPES })}`;
  const res = NextResponse.redirect(url);
  res.cookies.set("li_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
