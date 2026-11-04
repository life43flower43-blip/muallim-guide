// النشر الآلي في صفحة فيسبوك عبر Graph API.
// الربط مرة واحدة من صفحة /connect: رمز الصفحة المأخوذ من رمز مستخدم طويل الأجل لا تنتهي صلاحيته.
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/public-bank";
import { allArticles, todayISO } from "@/lib/articles";
import { dayNumber, dayPlan, SLOTS, type Slot } from "@/lib/telegram";

const G = "https://graph.facebook.com/v21.0";
export const FB_SCOPES = "pages_manage_posts,pages_read_engagement,pages_show_list";
export const fbConfigured = () => !!process.env.FACEBOOK_APP_ID && !!process.env.FACEBOOK_APP_SECRET;
export const fbRedirect = () => `${SITE_URL}/api/social/facebook/callback`;

async function gget(path: string, params: Record<string, string>) {
  const r = await fetch(`${G}${path}?${new URLSearchParams(params)}`);
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
}

/** يحوّل رمز الدخول إلى رمز صفحة دائم ويحفظه */
export async function connectFacebook(code: string) {
  const id = process.env.FACEBOOK_APP_ID!, secret = process.env.FACEBOOK_APP_SECRET!;
  const short = await gget("/oauth/access_token", { client_id: id, client_secret: secret, redirect_uri: fbRedirect(), code });
  const long = await gget("/oauth/access_token", { grant_type: "fb_exchange_token", client_id: id, client_secret: secret, fb_exchange_token: short.access_token });
  const me = await gget("/me", { access_token: long.access_token, fields: "id,name" });
  const pages = await gget("/me/accounts", { access_token: long.access_token, fields: "id,name,access_token" });
  const want = process.env.FACEBOOK_PAGE_ID;
  const page = (pages.data as { id: string; name: string; access_token: string }[]).find((p) => !want || p.id === want);
  if (!page) throw new Error("لم أجد صفحة. تأكد أنك مشرف على صفحة «تربوي» واخترتها عند الموافقة.");
  const prev = await db.socialAccount.findUnique({ where: { platform: "facebook" } });
  if (prev && prev.ownerId !== me.id) throw new Error("هذه المنصة مربوطة بحساب آخر.");
  await db.socialAccount.upsert({
    where: { platform: "facebook" },
    create: { platform: "facebook", ownerId: me.id, accountId: page.id, name: page.name, token: page.access_token },
    update: { accountId: page.id, name: page.name, token: page.access_token },
  });
  return page.name;
}

// الوسوم: تتغير في كل منشور طوال السنة (بحسب رقم اليوم والموعد)، وتجمع:
// وسم العلامة + وسمًا عن الرخصة + وسمين عن موضوع المنشور + وسمًا عن نوع المنشور + وسمًا عن البلد
const PICK = <T,>(list: T[], n: number) => list[((n % list.length) + list.length) % list.length];
const BRAND = ["#تربوي", "#تطبيق_تربوي", "#موقع_تربوي", "#منصة_تربوي"];
const LICENSE = ["#الرخصة_المهنية", "#اختبار_الرخصة_المهنية", "#الرخصة_المهنية_للمعلمين", "#اختبار_المعلمين", "#الاختبار_التربوي_العام", "#رخصة_المعلم", "#اختبار_الكفايات", "#كفايات_المعلمين", "#التوظيف_التعليمي", "#قياس"];
const TOPIC: Record<string, string[]> = {
  M1: ["#علم_نفس_النمو", "#مراحل_النمو", "#خصائص_المتعلمين", "#نمو_الطفل"],
  M2: ["#علم_النفس_التربوي", "#الذكاء", "#الدافعية", "#الفروق_الفردية"],
  M3: ["#نظريات_التعلم", "#التعلم", "#بياجيه", "#السلوكية", "#البنائية"],
  M4: ["#القياس_والتقويم", "#التقويم_التربوي", "#بناء_الاختبارات", "#التقويم_البنائي"],
  M5: ["#طرق_التدريس", "#استراتيجيات_التدريس", "#إدارة_الصف", "#مهارات_التدريس"],
  SE1: ["#التربية_الخاصة", "#التعليم_الدامج", "#صعوبات_التعلم", "#ذوي_الاحتياجات_الخاصة"],
  F1: ["#أخلاقيات_المهنة", "#أسس_التربية", "#التطوير_المهني", "#القيم_المهنية"],
  C1: ["#مهارات_التفكير", "#التفكير_الناقد", "#مهارات_القرن_21", "#حل_المشكلات"],
  AI1: ["#الذكاء_الاصطناعي_في_التعليم", "#التعليم_الرقمي", "#تقنيات_التعليم", "#التحول_الرقمي"],
  L1: ["#القيادة_المدرسية", "#أنماط_القيادة", "#رخصة_القيادة_المدرسية", "#الإشراف_التربوي"],
  G1: ["#التربية_والتعليم", "#التعليم", "#المعلم", "#ثقافة_تربوية"],
};
const KIND: Record<string, string[]> = {
  tip: ["#معلومة_تربوية", "#معلومة_اليوم", "#فائدة_تربوية", "#تعلم_كل_يوم"],
  q: ["#سؤال_اليوم", "#اختبر_نفسك", "#أسئلة_الرخصة_المهنية", "#تحدي_اليوم", "#نماذج_اختبارات"],
  app: ["#تطبيق_تعليمي", "#تعلم_مجاني", "#تطبيقات_تعليمية", "#ذاكر_من_جوالك"],
  site: ["#مصادر_تعليمية", "#موقع_تعليمي", "#مراجعة_مجانية", "#ملخصات_تربوية"],
};
const PLACE = ["#معلمين_السعودية", "#معلمات_السعودية", "#السعودية", "#معلمين_الإمارات", "#معلمين_مصر", "#معلم", "#معلمة", "#كلية_التربية"];

function tagsFor(iso: string, slot: Slot, course: string, kind: string) {
  const day = dayNumber(iso);
  const n = day * 4 + SLOTS.indexOf(slot);
  // منشور التعريف: وسم التطبيق أو الموقع حسب نوعه، وموضوع يتغير كل يوم
  const keys = Object.keys(TOPIC);
  const topic = kind === "app" || kind === "site" ? TOPIC[PICK(keys, day)] : (TOPIC[course] ?? TOPIC.G1);
  const brand = kind === "app" ? "#تطبيق_تربوي" : kind === "site" ? "#موقع_تربوي" : PICK(BRAND, day + SLOTS.indexOf(slot) * 3);
  const list = [brand, PICK(LICENSE, n * 3 + 1), PICK(topic, n), PICK(topic, n + 1), PICK(KIND[kind], n * 7), PICK(PLACE, n * 5 + 2)];
  return "\n\n" + [...new Set(list)].join(" ");
}
const courseOf = (href: string) => href.split("/")[2] ?? "G1";

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];

/** منشور فيسبوك لموعد من اليوم، من الجدول نفسه الذي تستخدمه قناة تيليجرام */
export function buildFacebookPost(iso = todayISO(), slot: Slot): { message: string; link?: string; photo?: string } | null {
  const p = buildPlain(iso, slot);
  return p ? { message: p.message + tagsFor(iso, slot, p.course, p.kind), link: p.link, photo: p.photo } : null;
}

function buildPlain(iso: string, slot: Slot): { message: string; link?: string; photo?: string; course: string; kind: string } | null {
  const plan = dayPlan(iso);
  if (slot === "tip" && plan.tip) {
    const t = plan.tip;
    const art = allArticles().find((a) => a.date === iso);
    const extra = art ? `\n\n🆕 مقال جديد: ${art.title}\n${SITE_URL}/articles/${art.slug}` : "";
    const message = `💡 ${t.title}\n\n${t.text}\n\nالشرح كاملًا: ${SITE_URL}${t.href}${extra}`;
    const meta = { course: courseOf(t.href), kind: "tip" };
    return t.image ? { message, photo: `${SITE_URL}${t.image}`, ...meta } : { message, link: `${SITE_URL}${t.href}`, ...meta };
  }
  if (slot === "promo" && plan.promo) {
    const p = plan.promo;
    return { message: `${p.kind === "app" ? "📱 تطبيق تربوي" : "🌐 موقع تربوي"}\n\n${p.text}\n\n${p.cta}: ${SITE_URL}${p.href}`, link: `${SITE_URL}${p.href}`, course: "G1", kind: p.kind };
  }
  if (slot === "q1" || slot === "q2") {
    const q = plan.qs[slot === "q1" ? 0 : 1];
    if (!q) return null;
    const opts = q.options.map((o, i) => `${LETTERS[i] ?? i + 1}) ${o}`).join("\n");
    return { message: `❓ ${slot === "q1" ? "سؤال الظهر" : "سؤال المساء"}\n\n${q.q}\n\n${opts}\n\nاكتب إجابتك في التعليقات 👇\nالإجابة والشرح: ${SITE_URL}${q.href}`, course: courseOf(q.href), kind: "q" };
  }
  return null;
}

export async function postToFacebook(post: { message: string; link?: string; photo?: string }) {
  const acc = await db.socialAccount.findUnique({ where: { platform: "facebook" } });
  if (!acc) return { ok: false, error: "not_connected" };
  const body = new URLSearchParams({ access_token: acc.token });
  let path = `/${acc.accountId}/feed`;
  if (post.photo) { path = `/${acc.accountId}/photos`; body.set("url", post.photo); body.set("caption", post.message); }
  else { body.set("message", post.message); if (post.link) body.set("link", post.link); }
  const r = await fetch(`${G}${path}`, { method: "POST", body });
  const j = await r.json().catch(() => ({}));
  return j.id ? { ok: true } : { ok: false, error: j.error?.message ?? `HTTP ${r.status}` };
}
