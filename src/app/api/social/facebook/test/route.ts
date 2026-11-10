// نشر تجريبي في صفحة فيسبوك من صفحة /connect: ينشر معلومة اليوم الآن، مرة كل ١٠ دقائق على الأكثر
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { buildFacebookPost, postToFacebook } from "@/lib/facebook";
import { todayISO } from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // لصاحب الموقع فقط
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/connect", req.url), 303);
  const back = (q: string) => NextResponse.redirect(new URL(`/connect?${q}`, req.url), 303);
  const acc = await db.socialAccount.findUnique({ where: { platform: "facebook" } });
  if (!acc) return back("fb=error&msg=" + encodeURIComponent("فيسبوك غير مربوط"));
  if (acc.lastAt && Date.now() - acc.lastAt.getTime() < 10 * 60_000) return back("fb=error&msg=" + encodeURIComponent("انتظر ١٠ دقائق بين كل تجربة وأخرى"));
  const post = buildFacebookPost(todayISO(), "tip");
  if (!post) return back("fb=error&msg=" + encodeURIComponent("لا يوجد منشور لليوم"));
  const r = await postToFacebook(post);
  return r.ok ? back("fb=posted") : back("fb=error&msg=" + encodeURIComponent(r.error ?? "فشل النشر"));
}
