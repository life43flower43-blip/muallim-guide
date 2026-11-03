// النشر الآلي في قناة تيليجرام: سؤال يومي على شكل «اختبار» مع رابط الشرح، ومقال اليوم إن وُجد.
// يعمل فقط حين يُضاف TELEGRAM_BOT_TOKEN وTELEGRAM_CHANNEL في إعدادات Vercel، والبوت مشرف في القناة.
import { pickQuestions, type SiteQ } from "@/lib/site-nav";
import { allArticles, todayISO } from "@/lib/articles";
import { SITE_URL, publicBank } from "@/lib/public-bank";
import { conceptImage } from "@/lib/concept-images";

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

/** سؤال صالح لحدود تيليجرام، بدءًا من موضع محدد في البنك، ولا يكرر ما في skip */
function fitQuestion(seed: number, skip: string[] = []): SiteQ | null {
  for (let k = 0; k < 60; k++) {
    const [q] = pickQuestions(1, seed + k);
    if (!q || skip.includes(q.id)) continue;
    if (q.q.length <= MAX_Q - 16 && q.options.length >= 2 && q.options.length <= 10 && q.options.every((o) => o.length <= MAX_OPT) && q.correct >= 0) return q;
  }
  return null;
}

/** سؤالا اليوم: مختلفان دائمًا، ويتغيران كل يوم */
export function questionsOfDay(day = dayNumber()): SiteQ[] {
  const a = fitQuestion(day * 14);
  const b = fitQuestion(day * 14 + 7, a ? [a.id] : []);
  return [a, b].filter((x): x is SiteQ => !!x);
}

/** معلومة اليوم: القاعدة المختصرة لمفهوم، تدور على كل المفاهيم بخطوة ثابتة فلا تتكرر قبل أن تمر عليها كلها */
export function tipOfDay(day = dayNumber()) {
  const list = publicBank().concepts.filter((c) => c.rule && c.rule.length >= 40 && c.rule.length <= 320);
  if (!list.length) return null;
  const step = 389; // عدد أولي: يمر على القائمة كلها قبل أن يعود
  const c = list[(day * step) % list.length];
  return { title: c.title, text: c.rule!, href: `/learn/${c.courseId}/${c.id}`, course: publicBank().courses[c.courseId], image: conceptImage(c.id) };
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function buildPosts(iso = todayISO()) {
  const day = dayNumber(iso);
  const posts: { method: string; body: Record<string, unknown> }[] = [];

  const tip = tipOfDay(day);
  if (tip) {
    const text = `💡 <b>معلومة اليوم</b>\n\n<b>${esc(tip.title)}</b>\n${esc(tip.text)}\n\n📚 ${esc(tip.course)}\n<a href="${SITE_URL}${tip.href}">اقرأ الشرح كاملًا</a>`;
    // إن كان للمفهوم صورة تعليمية تُرسل الصورة والمعلومة تحتها، وإلا تُرسل المعلومة نصًا
    posts.push(
      tip.image
        ? { method: "sendPhoto", body: { photo: `${SITE_URL}${tip.image}`, caption: text, parse_mode: "HTML" } }
        : { method: "sendMessage", body: { text, parse_mode: "HTML", link_preview_options: { is_disabled: true } } }
    );
  }

  const qs = questionsOfDay(day);
  qs.forEach((q, n) => {
    posts.push({
      method: "sendPoll",
      body: {
        question: clip(`${n === 0 ? "السؤال الأول" : "السؤال الثاني"}: ${q.q}`, MAX_Q),
        options: q.options.map((text) => ({ text })),
        type: "quiz",
        correct_option_id: q.correct,
        explanation: clip(q.reason, MAX_EXPL),
        is_anonymous: true,
      },
    });
  });
  if (qs.length) {
    posts.push({
      method: "sendMessage",
      body: {
        text: `📘 <b>شرح سؤالَي اليوم:</b>\n${qs.map((q) => `• <a href="${SITE_URL}${q.href}">${esc(q.concept)}</a>`).join("\n")}\n\n✍️ اختبار الأسبوع: <a href="${SITE_URL}/weekly-test">٢٠ سؤالًا جديدة كل أحد</a>`,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      },
    });
  }

  // مقال اليوم إن نُشر مقال جديد في هذا التاريخ
  for (const a of allArticles().filter((x) => x.date === iso).slice(0, 1)) {
    posts.push({
      method: "sendMessage",
      body: {
        text: `🆕 <b>مقال جديد:</b> ${esc(a.title)}\n\n${esc(clip(a.description, 220))}\n\n<a href="${SITE_URL}/articles/${a.slug}">اقرأ المقال</a>`,
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
