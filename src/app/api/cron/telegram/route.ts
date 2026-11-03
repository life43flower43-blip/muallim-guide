// ============================================================================
// /api/cron/telegram — النشر اليومي في قناة تيليجرام، يستدعيه مجدول Vercel كل صباح
// محمي بـ CRON_SECRET إن وُجد (يرسله Vercel في ترويسة Authorization تلقائيًا)،
// وإلا يُقبل طلب مجدول Vercel وحده. و?dry=1 يعرض المنشورات دون إرسالها.
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { buildPosts, sendPosts, telegramConfigured } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const fromCron = (request.headers.get("user-agent") ?? "").startsWith("vercel-cron");
  const authorized = secret ? request.headers.get("authorization") === `Bearer ${secret}` : fromCron;
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const posts = buildPosts();
  if (request.nextUrl.searchParams.get("dry") === "1") return NextResponse.json({ posts });
  if (!telegramConfigured()) return NextResponse.json({ skipped: "telegram_not_configured", posts: posts.length });

  const results = await sendPosts(posts);
  return NextResponse.json({ results });
}
