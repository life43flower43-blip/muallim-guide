// النشر الآلي في قناة تيليجرام: سؤال يومي على شكل «اختبار» مع رابط الشرح، ومقال اليوم إن وُجد.
// يعمل فقط حين يُضاف TELEGRAM_BOT_TOKEN وTELEGRAM_CHANNEL في إعدادات Vercel، والبوت مشرف في القناة.
import { pickQuestions, type SiteQ } from "@/lib/site-nav";
import { allArticles, todayISO } from "@/lib/articles";
import { SITE_URL, publicBank } from "@/lib/public-bank";
import { conceptImage } from "@/lib/concept-images";
import { PROMOS } from "@/lib/telegram-promos";
import { crossPromo } from "@/lib/social-links";
import schedule from "../../content/telegram-schedule.json";
import themes from "../../content/telegram-themes.json";

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

export const SLOTS = ["tip", "q1", "promo", "q2"] as const;
export type Slot = (typeof SLOTS)[number];

type Day = { date: string; theme: number; tip: string; q1: string; q2: string; promo: number };
const SCHEDULE = new Map((schedule as Day[]).map((d) => [d.date, d]));

/** سؤال من البنك برقمه، بالشكل الذي يُنشر به */
function questionById(id: string): SiteQ | null {
  const b = publicBank();
  const q = b.questions.find((x) => x.id === id);
  const c = q && b.concepts.find((x) => x.id === q.conceptId);
  if (!q || !c) return null;
  return { id: q.id, q: q.question, options: q.options.map((o) => o.text), correct: q.options.findIndex((o) => o.isCorrect), reason: q.reason, course: c.courseId, href: `/learn/${c.courseId}/${c.id}`, concept: c.title };
}

function tipById(id: string) {
  const b = publicBank();
  const c = b.concepts.find((x) => x.id === id);
  if (!c?.rule) return null;
  return { title: c.title, text: c.rule, href: `/learn/${c.courseId}/${c.id}`, course: b.courses[c.courseId], image: conceptImage(c.id) };
}

/** محتوى اليوم: من الجدول السنوي (content/telegram-schedule.json)، وبعد انتهائه يُختار بالحساب */
export function dayPlan(iso = todayISO()) {
  const d = SCHEDULE.get(iso);
  const day = dayNumber(iso);
  if (d) return { tip: tipById(d.tip), qs: [questionById(d.q1), questionById(d.q2)], promo: PROMOS[d.promo % PROMOS.length] };
  const qs = questionsOfDay(day);
  return { tip: tipOfDay(day), qs: [qs[0] ?? null, qs[1] ?? null], promo: PROMOS[day % PROMOS.length] };
}

/** منشورات موعد واحد: الصباح معلومة، والظهر سؤال، والعصر تعريف بالتطبيق أو الموقع، والمساء سؤال */
export function buildPosts(iso = todayISO(), slot: Slot = "tip") {
  const plan = dayPlan(iso);
  const posts: { method: string; body: Record<string, unknown> }[] = [];
  const msg = (text: string, preview = false) => ({ method: "sendMessage", body: { text, parse_mode: "HTML", link_preview_options: { is_disabled: !preview } } });

  // موضوع اليوم من أيام الأسبوع (الأحد = ٠)
  const wd = (new Date(iso + "T12:00:00Z").getUTCDay()) % 7;
  const theme = themes[wd];

  if (slot === "tip" && wd === 0) {
    // صباح الأحد: خطة مذاكرة الأسبوع
    posts.push(msg(`🗓 <b>خطة مذاكرة الأسبوع</b>\n\n${themes.map((t) => `• <b>${t.day}:</b> ${t.title}`).join("\n")}\n\nكل يوم: معلومة صباحًا، وسؤال ظهرًا، وسؤال مساءً من موضوع اليوم.\n\n<a href="${SITE_URL}/weekly-test">اختبار الأسبوع الجديد ←</a>`));
  }

  if (slot === "tip" && plan.tip) {
    const t = plan.tip;
    const text = `💡 <b>${esc(t.title)}</b>\n<i>${theme.day}: ${theme.title}</i>\n\n${esc(t.text)}\n\n<a href="${SITE_URL}${t.href}">الشرح كاملًا ←</a>`;
    // إن كان للمفهوم صورة تعليمية تُرسل الصورة والمعلومة تحتها
    posts.push(t.image ? { method: "sendPhoto", body: { photo: `${SITE_URL}${t.image}`, caption: text, parse_mode: "HTML" } } : msg(text));
    // ومقال اليوم إن نُشر مقال جديد في هذا التاريخ
    for (const a of allArticles().filter((x) => x.date === iso).slice(0, 1))
      posts.push(msg(`🆕 <b>مقال جديد:</b> ${esc(a.title)}\n\n${esc(clip(a.description, 220))}\n\n<a href="${SITE_URL}/articles/${a.slug}">اقرأ المقال ←</a>`, true));
  }

  if (slot === "promo" && wd === 5) {
    // الجمعة: كل منصاتنا
    posts.push(msg(crossPromo("telegram", true)));
  } else if (slot === "promo" && wd === 6) {
    // السبت: تذكير باختبار الأسبوع قبل أن يتجدد غدًا
    posts.push(msg(`⏳ <b>آخر يوم لاختبار هذا الأسبوع</b>\n\n٢٠ سؤالًا من مواضيع الأسبوع، مع التصحيح والتفسير فورًا. غدًا يُنشر اختبار جديد.\n\n<a href="${SITE_URL}/weekly-test">ابدأ الاختبار ←</a>`));
  } else if (slot === "promo" && plan.promo) {
    const p = plan.promo;
    const tag = p.kind === "app" ? "📱 تطبيق تربوي" : "🌐 موقع تربوي";
    posts.push(msg(`${tag}\n\n${esc(p.text)}\n\n<a href="${SITE_URL}${p.href}">${esc(p.cta)} ←</a>`));
  }

  if (slot === "q1" || slot === "q2") {
    const q = plan.qs[slot === "q1" ? 0 : 1];
    if (q) {
      posts.push({
        method: "sendPoll",
        body: {
          question: clip(`${slot === "q1" ? "سؤال الظهر" : "سؤال المساء"}: ${q.q}`, MAX_Q),
          options: q.options.map((text) => ({ text })),
          type: "quiz",
          correct_option_id: q.correct,
          explanation: clip(q.reason, MAX_EXPL),
          is_anonymous: true,
        },
      });
      posts.push(msg(`📘 شرح السؤال: <a href="${SITE_URL}${q.href}">${esc(q.concept)}</a>`));
    }
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
