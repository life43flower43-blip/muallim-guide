// صفحة ربط منصات النشر الآلي (لصاحب الموقع)، لا تظهر في محركات البحث
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { fbConfigured } from "@/lib/facebook";
import { liConfigured } from "@/lib/linkedin";

export const metadata: Metadata = { title: "ربط المنصات | تربوي", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Connect({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const fb = await db.socialAccount.findUnique({ where: { platform: "facebook" } }).catch(() => null);
  const li = await db.socialAccount.findUnique({ where: { platform: "linkedin" } }).catch(() => null);
  const liDays = li?.expiresAt ? Math.ceil((li.expiresAt.getTime() - Date.now()) / 86400000) : null;
  const note =
    sp.fb === "ok" ? `✅ تم ربط صفحة «${sp.name}». سيبدأ النشر في الموعد القادم.`
    : sp.fb === "missing" ? "⚠️ أضف FACEBOOK_APP_ID وFACEBOOK_APP_SECRET في Vercel ثم Redeploy."
    : sp.fb === "denied" ? "⚠️ لم تكتمل الموافقة. حاول مرة أخرى."
    : sp.fb === "error" ? `⚠️ ${sp.msg ?? "حدث خطأ"}`
    : sp.li === "ok" ? `✅ تم ربط لينكدإن «${sp.name}». سيبدأ النشر في الموعد القادم.`
    : sp.li === "missing" ? "⚠️ أضف LINKEDIN_CLIENT_ID وLINKEDIN_CLIENT_SECRET في Vercel ثم Redeploy."
    : sp.li === "denied" ? "⚠️ لم تكتمل موافقة لينكدإن. حاول مرة أخرى."
    : sp.li === "error" ? `⚠️ ${sp.msg ?? "حدث خطأ"}` : "";
  return (
    <main dir="rtl" className="mx-auto max-w-lg p-5 font-sans">
      <h1 className="text-[24px] font-extrabold text-[#14302A]">ربط منصات النشر</h1>
      <p className="mt-1 text-[14px] text-[#5B7268]">اربط كل منصة مرة واحدة، وبعدها ينشر البوت وحده حسب جدول القناة.</p>
      {note && <p className="mt-4 rounded-xl bg-[#EEF5F1] p-3 text-[14px] leading-7 text-[#14302A]">{note}</p>}
      <section className="mt-5 rounded-2xl border border-[#E2ECE6] bg-white p-4">
        <p className="font-bold text-[#14302A]">فيسبوك</p>
        <p className="mt-1 text-[14px] text-[#5B7268]">{fb ? `مربوط بصفحة «${fb.name}»` : fbConfigured() ? "غير مربوط بعد" : "ينتظر FACEBOOK_APP_ID وFACEBOOK_APP_SECRET في Vercel"}</p>
        <a href="/api/social/facebook/start" className="mt-3 inline-block rounded-xl bg-[#1877F2] px-4 py-2 font-bold text-white">{fb ? "إعادة الربط" : "اربط صفحة فيسبوك"}</a>
      </section>
      <section className="mt-4 rounded-2xl border border-[#E2ECE6] bg-white p-4">
        <p className="font-bold text-[#14302A]">لينكدإن</p>
        <p className="mt-1 text-[14px] text-[#5B7268]">
          {li ? (liDays !== null && liDays <= 0 ? "انتهى الربط، أعد الربط ليستمر النشر" : `مربوط بحساب «${li.name}»، ويحتاج إعادة ربط بعد ${liDays} يومًا`) : liConfigured() ? "غير مربوط بعد" : "ينتظر LINKEDIN_CLIENT_ID وLINKEDIN_CLIENT_SECRET في Vercel"}
        </p>
        <a href="/api/social/linkedin/start" className="mt-3 inline-block rounded-xl bg-[#0A66C2] px-4 py-2 font-bold text-white">{li ? "إعادة الربط" : "اربط لينكدإن"}</a>
      </section>
    </main>
  );
}
