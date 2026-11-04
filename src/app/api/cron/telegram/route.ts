// ============================================================================
// /api/cron/telegram — النشر اليومي في قناة تيليجرام، يستدعيه مجدول Vercel كل صباح
// محمي بـ CRON_SECRET إن وُجد (يرسله Vercel في ترويسة Authorization تلقائيًا)،
// وإلا يُقبل طلب مجدول Vercel وحده. و?dry=1 يعرض المنشورات دون إرسالها.
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { buildPosts, sendPosts, SLOTS, telegramConfigured, type Slot } from "@/lib/telegram";
import { todayISO } from "@/lib/articles";
import { db } from "@/lib/db";
import { buildFacebookPost, postToFacebook } from "@/lib/facebook";
import { buildLinkedInPost, postToLinkedIn } from "@/lib/linkedin";

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
  const fbPost = buildFacebookPost(iso, slot);
  if (request.nextUrl.searchParams.get("dry") === "1") return NextResponse.json({ slot, posts, facebook: fbPost });

  // كل منصة مرة واحدة فقط لكل يوم وموعد، حتى لو شُغّل المجدول مرتين
  const once = async (key: string, run: () => Promise<boolean>) => {
    try {
      await db.telegramPost.create({ data: { key } });
    } catch {
      return "already_posted";
    }
    const ok = await run().catch(() => false);
    if (!ok) await db.telegramPost.delete({ where: { key } }).catch(() => {}); // يُعاد في المرة القادمة
    return ok ? "sent" : "failed";
  };

  const out: Record<string, unknown> = {};
  out.telegram = telegramConfigured()
    ? await once(`${iso}:${slot}`, async () => (await sendPosts(posts)).some((r) => r.ok))
    : "not_configured";
  const fbConnected = await db.socialAccount.findUnique({ where: { platform: "facebook" } }).catch(() => null);
  out.facebook = fbPost && fbConnected ? await once(`${iso}:${slot}:fb`, async () => (await postToFacebook(fbPost)).ok) : "not_connected";
  // لينكدإن: منشور واحد في اليوم مع منشور الصباح
  if (slot === "tip") {
    const liPost = buildLinkedInPost(iso);
    const liConnected = await db.socialAccount.findUnique({ where: { platform: "linkedin" } }).catch(() => null);
    out.linkedin = liPost && liConnected ? await once(`${iso}:tip:li`, async () => (await postToLinkedIn(liPost)).ok) : "not_connected";
  }
  return NextResponse.json(out);
}
