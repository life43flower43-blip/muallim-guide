// صفحة ربط منصات النشر الآلي (لصاحب الموقع)، لا تظهر في محركات البحث
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { fbConfigured } from "@/lib/facebook";
import { liConfigured } from "@/lib/linkedin";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { publicBank } from "@/lib/public-bank";

export const metadata: Metadata = { title: "ربط المنصات | تربوي", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Connect({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  // الصفحة لصاحب الموقع فقط: يدخل بالمفتاح السري المحفوظ في Vercel (CRON_SECRET أو ADMIN_KEY)
  if (!(await isAdmin())) {
    const msg = !adminConfigured() ? "أضف CRON_SECRET (١٦ حرفًا على الأقل) في Vercel ثم انشر من جديد." : sp.admin === "wrong" ? "المفتاح غير صحيح." : sp.admin === "wait" ? "محاولات كثيرة، انتظر دقيقة." : "";
    return (
      <main dir="rtl" className="mx-auto max-w-sm p-5 font-sans">
        <h1 className="text-[22px] font-extrabold text-[#14302A]">دخول صاحب الموقع</h1>
        <p className="mt-1 text-[14px] leading-7 text-[#5B7268]">اكتب قيمة CRON_SECRET التي وضعتها في Vercel.</p>
        {msg && <p className="mt-3 rounded-xl bg-[#FDECEC] p-3 text-[14px] text-[#8A1F1F]">{msg}</p>}
        <form action="/api/admin/login" method="post" className="mt-4 space-y-3">
          <input name="key" type="password" autoComplete="current-password" required className="w-full rounded-xl border border-[#D6E6DE] px-3 py-2.5" />
          <button className="w-full rounded-xl bg-[#136F5C] px-4 py-2.5 font-bold text-white">دخول</button>
        </form>
      </main>
    );
  }
  const reports = await db.questionReport
    .groupBy({ by: ["questionId"], _count: { questionId: true }, _max: { createdAt: true }, orderBy: { _count: { questionId: "desc" } }, take: 50 })
    .catch(() => []);
  const bankQ = reports.length ? new Map(publicBank().questions.map((q) => [q.id, q])) : new Map();
  const bankC = reports.length ? new Map(publicBank().concepts.map((c) => [c.id, c])) : new Map();
  const errors = await db.clientError.findMany({ orderBy: { lastAt: "desc" }, take: 30 }).catch(() => []);
  const pushDevices = await db.pushSubscription.count().catch(() => 0);
  const pushUsers = await db.pushSubscription.groupBy({ by: ["userId"], where: { userId: { not: null } } }).then((r) => r.length).catch(() => 0);
  const fb = await db.socialAccount.findUnique({ where: { platform: "facebook" } }).catch(() => null);
  const li = await db.socialAccount.findUnique({ where: { platform: "linkedin" } }).catch(() => null);
  const liDays = li?.expiresAt ? Math.ceil((li.expiresAt.getTime() - Date.now()) / 86400000) : null;
  const note =
    sp.fb === "ok" ? `✅ تم ربط صفحة «${sp.name}». سيبدأ النشر في الموعد القادم.`
    : sp.fb === "posted" ? "✅ نُشر منشور تجريبي في الصفحة الآن. افتح صفحتك على فيسبوك وتأكد."
    : sp.fb === "missing" ? "⚠️ أضف FACEBOOK_APP_ID وFACEBOOK_APP_SECRET في Vercel ثم Redeploy."
    : sp.fb === "denied" ? "⚠️ لم تكتمل الموافقة. حاول مرة أخرى."
    : sp.fb === "error" ? `⚠️ ${sp.msg ?? "حدث خطأ"}`
    : sp.li === "ok" ? `✅ تم ربط لينكدإن «${sp.name}». سيبدأ النشر في الموعد القادم.`
    : sp.li === "missing" ? "⚠️ أضف LINKEDIN_CLIENT_ID وLINKEDIN_CLIENT_SECRET في Vercel ثم Redeploy."
    : sp.li === "denied" ? "⚠️ لم تكتمل موافقة لينكدإن. حاول مرة أخرى."
    : sp.li === "posted" ? "✅ نُشر منشور تجريبي في لينكدإن."
    : sp.li === "error" ? `⚠️ ${sp.msg ?? "حدث خطأ"}`
    : sp.push === "sent" ? `✅ أُرسل إشعار تجريبي إلى ${sp.n} جهاز. انظر شاشة جوالك.`
    : sp.push === "none" ? "⚠️ هذا الحساب لم يسمح بالإشعارات على أي جهاز بعد. افتح التطبيق واضغط «سماح»."
    : sp.push === "nouser" ? "⚠️ لا يوجد حساب بهذا البريد."
    : sp.push === "fail" ? "⚠️ فشل الإرسال إلى الجهاز. أعد السماح بالإشعارات في التطبيق." : "";
  return (
    <main dir="rtl" className="mx-auto max-w-lg p-5 font-sans">
      <h1 className="text-[24px] font-extrabold text-[#14302A]">ربط منصات النشر</h1>
      <p className="mt-1 text-[14px] text-[#5B7268]">اربط كل منصة مرة واحدة، وبعدها ينشر البوت وحده حسب جدول القناة.</p>
      {note && <p className="mt-4 rounded-xl bg-[#EEF5F1] p-3 text-[14px] leading-7 text-[#14302A]">{note}</p>}
      <section className="mt-5 rounded-2xl border border-[#E2ECE6] bg-white p-4">
        <p className="font-bold text-[#14302A]">فيسبوك</p>
        <p className="mt-1 text-[14px] text-[#5B7268]">{fb ? `مربوط بصفحة «${fb.name}»` : fbConfigured() ? "غير مربوط بعد" : "ينتظر FACEBOOK_APP_ID وFACEBOOK_APP_SECRET في Vercel"}</p>
        {fb?.lastAt && (
          <p className="mt-2 text-[13px] leading-6 text-[#5B7268]">
            آخر محاولة نشر: {fb.lastAt.toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })} — {fb.lastOk ? "نجحت ✅" : `فشلت ❌ ${fb.lastError ?? ""}`}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/social/facebook/start" className="inline-block rounded-xl bg-[#1877F2] px-4 py-2 font-bold text-white">{fb ? "إعادة الربط" : "اربط صفحة فيسبوك"}</a>
          {fb && (
            <form action="/api/social/facebook/test" method="post">
              <button className="rounded-xl border border-[#1877F2] px-4 py-2 font-bold text-[#1877F2]">انشر منشورًا تجريبيًا الآن</button>
            </form>
          )}
        </div>
      </section>
      <section className="mt-4 rounded-2xl border border-[#E2ECE6] bg-white p-4">
        <p className="font-bold text-[#14302A]">لينكدإن</p>
        <p className="mt-1 text-[14px] text-[#5B7268]">
          {li ? (liDays !== null && liDays <= 0 ? "انتهى الربط، أعد الربط ليستمر النشر" : `مربوط بحساب «${li.name}»، ويحتاج إعادة ربط بعد ${liDays} يومًا`) : liConfigured() ? "غير مربوط بعد" : "ينتظر LINKEDIN_CLIENT_ID وLINKEDIN_CLIENT_SECRET في Vercel"}
        </p>
        {li?.lastAt && (
          <p className="mt-1 text-[13px] text-[#5B7268]">
            آخر محاولة نشر: {li.lastAt.toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })} — {li.lastOk ? "نجحت ✅" : `فشلت ❌ ${li.lastError ?? ""}`}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/social/linkedin/start" className="inline-block rounded-xl bg-[#0A66C2] px-4 py-2 font-bold text-white">{li ? "إعادة الربط" : "اربط لينكدإن"}</a>
          {li && (
            <form action="/api/social/linkedin/try" method="post">
              <button className="rounded-xl border border-[#0A66C2] px-4 py-2 font-bold text-[#0A66C2]">انشر منشورًا تجريبيًا الآن</button>
            </form>
          )}
        </div>
      </section>
      <section className="mt-4 rounded-2xl border border-[#E2ECE6] bg-white p-4">
        <p className="font-bold text-[#14302A]">الإشعارات</p>
        <p className="mt-1 text-[14px] text-[#5B7268]">أجهزة مسجلة: {pushDevices} · حسابات: {pushUsers}. التذكير التلقائي: صباحًا ٦ وظهرًا ١١ ومساءً ١٦ بتوقيت غرينتش، مرة واحدة يوميًا لكل جهاز.</p>
        <form action="/api/admin/push-test" method="post" className="mt-3 space-y-2">
          <input name="email" type="email" required placeholder="بريد حسابك في التطبيق" dir="ltr" className="w-full rounded-xl border border-[#D6E6DE] px-3 py-2.5" />
          <button className="w-full rounded-xl bg-[#136F5C] px-4 py-2.5 font-bold text-white">أرسل إشعارًا تجريبيًا إلى جوالي</button>
        </form>
      </section>
      <section className="mt-5 rounded-2xl border border-[#E2ECE6] bg-white p-4">
        <p className="font-bold text-[#14302A]">أعطال عند المستخدمين ({errors.length})</p>
        {errors.length === 0 ? (
          <p className="mt-1 text-[14px] text-[#5B7268]">لا أعطال مسجلة.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {errors.map((e) => (
              <li key={e.id} className="rounded-xl bg-[#FDF6F6] p-3 text-[13px] leading-6" dir="ltr">
                <span className="font-bold text-[#8A1F1F]">×{e.count}</span> · v{e.version ?? "?"} · {e.url ?? ""} · {e.lastAt.toISOString().slice(0, 16).replace("T", " ")}
                <p className="break-words text-[#14302A]">{e.message}</p>
                {e.ua && <p className="break-words text-[11px] text-[#5B7268]">{e.ua}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-4 rounded-2xl border border-[#E2ECE6] bg-white p-4">
        <p className="font-bold text-[#14302A]">بلاغات «خطأ في السؤال» ({reports.length})</p>
        {reports.length === 0 ? (
          <p className="mt-1 text-[14px] text-[#5B7268]">لا بلاغات بعد.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {reports.map((r) => {
              const q = bankQ.get(r.questionId);
              const c = q ? bankC.get(q.conceptId) : undefined;
              return (
                <li key={r.questionId} className="rounded-xl bg-[#F6FAF8] p-3 text-[14px] leading-7">
                  <span className="font-bold text-[#8A1F1F]">{r._count.questionId} بلاغ</span> · <span dir="ltr">{r.questionId}</span>
                  <p className="text-[#14302A]">{q?.question ?? "سؤال محذوف"}</p>
                  {c && <a href={`/learn/${c.courseId}/${c.id}`} className="text-[13px] font-bold text-[#136F5C]">{c.title}</a>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
