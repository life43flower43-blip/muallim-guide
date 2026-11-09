// نشر تجريبي في لينكدإن من صفحة /connect: ينشر منشور اليوم الآن، مرة كل ١٠ دقائق على الأكثر
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildLinkedInPost, postToLinkedIn } from "@/lib/linkedin";
import { todayISO } from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const back = (q: string) => NextResponse.redirect(new URL(`/connect?${q}`, req.url), 303);
  const acc = await db.socialAccount.findUnique({ where: { platform: "linkedin" } });
  if (!acc) return back("li=error&msg=" + encodeURIComponent("لينكدإن غير مربوط"));
  if (acc.lastAt && Date.now() - acc.lastAt.getTime() < 10 * 60_000) return back("li=error&msg=" + encodeURIComponent("انتظر ١٠ دقائق بين كل تجربة وأخرى"));
  const post = buildLinkedInPost(todayISO());
  if (!post) return back("li=error&msg=" + encodeURIComponent("لا يوجد منشور لليوم"));
  const r = await postToLinkedIn(post);
  return r.ok ? back("li=posted") : back("li=error&msg=" + encodeURIComponent(r.error ?? "فشل النشر"));
}
