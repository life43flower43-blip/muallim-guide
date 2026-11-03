// ============================================================================
// /api/cron/telegram — النشر اليومي في قناة تيليجرام، يستدعيه مجدول Vercel كل صباح
// محمي بـ CRON_SECRET إن وُجد (يرسله Vercel في ترويسة Authorization تلقائيًا)،
// وإلا يُقبل طلب مجدول Vercel وحده. و?dry=1 يعرض المنشورات دون إرسالها.
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { buildPosts, sendPosts, SLOTS, telegramConfigured, type Slot } from "@/lib/telegram";
import { todayISO } from "@/lib/articles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const fromCron = (request.headers.get("user-agent") ?? "").startsWith("vercel-cron");
  const authorized = secret ? request.headers.get("authorization") === `Bearer ${secret}` : fromCron;
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ?slot=tip|q1|q2 — ثلاثة مواعيد في اليوم (انظر vercel.json)
  const raw = request.nextUrl.searchParams.get("slot") ?? "tip";
  const slot: Slot = (SLOTS as readonly string[]).includes(raw) ? (raw as Slot) : "tip";
  const iso = todayISO();
  const posts = buildPosts(iso, slot);
  if (request.nextUrl.searchParams.get("dry") === "1") return NextResponse.json({ slot, posts });
  if (!telegramConfigured()) return NextResponse.json({ skipped: "telegram_not_configured", posts: posts.length });

  // مرة واحدة فقط لكل يوم وموعد، حتى لو شُغّل المجدول مرتين
  try {
    await db.telegramPost.create({ data: { key: `${iso}:${slot}` } });
  } catch {
    return NextResponse.json({ skipped: "already_posted", key: `${iso}:${slot}` });
  }

  const results = await sendPosts(posts);
  // إن فشل الإرسال كله يُحذف القيد ليُعاد في المرة القادمة
  if (results.every((r) => !r.ok)) await db.telegramPost.delete({ where: { key: `${iso}:${slot}` } }).catch(() => {});
  return NextResponse.json({ results });
}
