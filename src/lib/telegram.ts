// النشر الآلي في قناة تيليجرام: سؤال يومي على شكل «اختبار» مع رابط الشرح، ومقال اليوم إن وُجد.
// يعمل فقط حين يُضاف TELEGRAM_BOT_TOKEN وTELEGRAM_CHANNEL في إعدادات Vercel، والبوت مشرف في القناة.
import { pickQuestions, type SiteQ } from "@/lib/site-nav";
import { allArticles, todayISO } from "@/lib/articles";
import { SITE_URL } from "@/lib/public-bank";

// حدود تيليجرام لاستطلاع الاختبار
const MAX_Q = 300;
const MAX_OPT = 100;
const MAX_EXPL = 200;

export const telegramConfigured = () => !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHANNEL;

/** رقم اليوم بتوقيت مكة، يتغير به السؤال كل يوم */
export function dayNumber(iso = todayISO()) {
  return Math.floor(new Date(iso + "T12:00:00Z").getTime() / 86400000);
}

/** اختصار النص عند آخر جملة أو كلمة قبل الحد */
function clip(t: string, max: number) {
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const end = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("،"), cut.lastIndexOf(" "));
  return (end > max * 0.6 ? cut.slice(0, end) : cut).trim() + "…";
}

/** سؤال اليوم: أول سؤال يناسب حدود تيليجرام، بدءًا من موضع اليوم في البنك */
export function questionOfDay(day = dayNumber()): SiteQ | null {
  for (let k = 0; k < 40; k++) {
    const [q] = pickQuestions(1, day * 7 + k);
    if (!q) continue;
    if (q.q.length <= MAX_Q && q.options.length >= 2 && q.options.length <= 10 && q.options.every((o) => o.length <= MAX_OPT) && q.correct >= 0) return q;
  }
  return null;
}

export function buildPosts(iso = todayISO()) {
  const q = questionOfDay(dayNumber(iso));
  const posts: { method: string; body: Record<string, unknown> }[] = [];
  if (q) {
    posts.push({
      method: "sendPoll",
      body: {
        question: q.q,
        options: q.options.map((text) => ({ text })),
        type: "quiz",
        correct_option_id: q.correct,
        explanation: clip(q.reason, MAX_EXPL),
        is_anonymous: true,
      },
    });
    posts.push({
      method: "sendMessage",
      body: {
        text: `📘 <b>الشرح الكامل:</b> <a href="${SITE_URL}${q.href}">${q.concept}</a>\n\n✍️ اختبار الأسبوع: <a href="${SITE_URL}/weekly-test">٢٠ سؤالًا جديدة كل أحد</a>`,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      },
    });
  }
  // مقال اليوم إن نُشر مقال جديد في هذا التاريخ (واحد فقط حتى لا تمتلئ القناة)
  for (const a of allArticles().filter((x) => x.date === iso).slice(0, 1)) {
    posts.push({
      method: "sendMessage",
      body: {
        text: `🆕 <b>مقال جديد:</b> ${a.title}\n\n${clip(a.description, 220)}\n\n<a href="${SITE_URL}/articles/${a.slug}">اقرأ المقال</a>`,
        parse_mode: "HTML",
      },
    });
  }
  return posts;
}

export async function sendPosts(posts: ReturnType<typeof buildPosts>) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chat_id = process.env.TELEGRAM_CHANNEL!;
  const results: { method: string; ok: boolean; error?: string }[] = [];
  for (const p of posts) {
    const res = await fetch(`https://api.telegram.org/bot${token}/${p.method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id, ...p.body }),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    results.push({ method: p.method, ok: !!j.ok, error: j.ok ? undefined : j.description });
  }
  return results;
}
