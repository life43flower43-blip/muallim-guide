// دخول صاحب الموقع إلى /connect بالمفتاح السري (CRON_SECRET أو ADMIN_KEY)
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, keyMatches } from "@/lib/admin";
import { checkRateLimitShared, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const back = (q: string) => NextResponse.redirect(new URL(`/connect${q}`, req.url), 303);
  const rl = await checkRateLimitShared(`admin:${getClientIP(req)}`, RATE_LIMITS.AUTH_LOGIN);
  if (!rl.allowed) return back("?admin=wait");
  const form = await req.formData().catch(() => null);
  const key = String(form?.get("key") ?? "").trim().slice(0, 200);
  if (!keyMatches(key)) return back("?admin=wrong");
  const res = back("");
  res.cookies.set(ADMIN_COOKIE, adminToken(key), { httpOnly: true, secure: true, sameSite: "lax", maxAge: 30 * 86400, path: "/" });
  return res;
}
