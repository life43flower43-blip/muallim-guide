// النشر الآلي في صفحة فيسبوك عبر Graph API.
// الربط مرة واحدة من صفحة /connect: رمز الصفحة المأخوذ من رمز مستخدم طويل الأجل لا تنتهي صلاحيته.
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/public-bank";
import { allArticles, todayISO } from "@/lib/articles";
import { dayPlan, type Slot } from "@/lib/telegram";

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

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];

/** منشور فيسبوك لموعد من اليوم، من الجدول نفسه الذي تستخدمه قناة تيليجرام */
export function buildFacebookPost(iso = todayISO(), slot: Slot): { message: string; link?: string; photo?: string } | null {
  const plan = dayPlan(iso);
  if (slot === "tip" && plan.tip) {
    const t = plan.tip;
    const art = allArticles().find((a) => a.date === iso);
    const extra = art ? `\n\n🆕 مقال جديد: ${art.title}\n${SITE_URL}/articles/${art.slug}` : "";
    const message = `💡 ${t.title}\n\n${t.text}\n\nالشرح كاملًا: ${SITE_URL}${t.href}${extra}`;
    return t.image ? { message, photo: `${SITE_URL}${t.image}` } : { message, link: `${SITE_URL}${t.href}` };
  }
  if (slot === "promo" && plan.promo) {
    const p = plan.promo;
    return { message: `${p.kind === "app" ? "📱 تطبيق تربوي" : "🌐 موقع تربوي"}\n\n${p.text}\n\n${p.cta}: ${SITE_URL}${p.href}`, link: `${SITE_URL}${p.href}` };
  }
  if (slot === "q1" || slot === "q2") {
    const q = plan.qs[slot === "q1" ? 0 : 1];
    if (!q) return null;
    const opts = q.options.map((o, i) => `${LETTERS[i] ?? i + 1}) ${o}`).join("\n");
    return { message: `❓ ${slot === "q1" ? "سؤال الظهر" : "سؤال المساء"}\n\n${q.q}\n\n${opts}\n\nاكتب إجابتك في التعليقات 👇\nالإجابة والشرح: ${SITE_URL}${q.href}` };
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
