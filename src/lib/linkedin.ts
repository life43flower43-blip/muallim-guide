// النشر الآلي في حساب لينكدإن عبر «Share on LinkedIn» (الصلاحية w_member_social).
// رمز الدخول ينتهي بعد نحو ٦٠ يومًا، فيعاد الربط من صفحة /connect.
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/public-bank";
import { allArticles, todayISO } from "@/lib/articles";
import { dayNumber, dayPlan } from "@/lib/telegram";
import { footerLine } from "@/lib/social-links";

export const LI_SCOPES = "openid profile w_member_social";
export const liConfigured = () => !!process.env.LINKEDIN_CLIENT_ID && !!process.env.LINKEDIN_CLIENT_SECRET;
export const liRedirect = () => `${SITE_URL}/api/social/linkedin/callback`;

export async function connectLinkedIn(code: string) {
  const r = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: liRedirect(), client_id: process.env.LINKEDIN_CLIENT_ID!, client_secret: process.env.LINKEDIN_CLIENT_SECRET! }),
  });
  const tok = await r.json();
  if (!tok.access_token) throw new Error(tok.error_description || tok.error || `HTTP ${r.status}`);
  const me = await (await fetch("https://api.linkedin.com/v2/userinfo", { headers: { authorization: `Bearer ${tok.access_token}` } })).json();
  if (!me.sub) throw new Error("تعذر قراءة الحساب");
  const prev = await db.socialAccount.findUnique({ where: { platform: "linkedin" } });
  if (prev && prev.ownerId !== me.sub) throw new Error("هذه المنصة مربوطة بحساب آخر.");
  const expiresAt = new Date(Date.now() + (Number(tok.expires_in) || 60 * 86400) * 1000);
  await db.socialAccount.upsert({
    where: { platform: "linkedin" },
    create: { platform: "linkedin", ownerId: me.sub, accountId: me.sub, name: me.name ?? "LinkedIn", token: tok.access_token, expiresAt },
    update: { name: me.name ?? "LinkedIn", token: tok.access_token, expiresAt },
  });
  return me.name ?? "LinkedIn";
}

const TAGS = ["#الرخصة_المهنية", "#التعليم", "#المعلم", "#التطوير_المهني", "#تربوي", "#اختبار_المعلمين", "#القيادة_التربوية", "#التعلم_المستمر"];

/** منشور لينكدإن الواحد في اليوم: المقال الجديد إن وُجد، وإلا معلومة اليوم */
export function buildLinkedInPost(iso = todayISO()): { text: string; url: string; title: string } | null {
  const n = dayNumber(iso);
  const tags = [0, 3, 5].map((k) => TAGS[(n + k) % TAGS.length]).join(" ");
  const art = allArticles().find((a) => a.date === iso);
  if (art) return { title: art.title, url: `${SITE_URL}/articles/${art.slug}`, text: `🆕 ${art.title}\n\n${art.description}\n\nاقرأ المقال كاملًا 👇\n\n${footerLine("linkedin")}\n\n${tags}` };
  const t = dayPlan(iso).tip;
  if (!t) return null;
  return { title: t.title, url: `${SITE_URL}${t.href}`, text: `💡 ${t.title}\n\n${t.text}\n\nالشرح كاملًا مع أمثلة من الصف 👇\n\n${footerLine("linkedin")}\n\n${tags}` };
}

export async function postToLinkedIn(p: { text: string; url: string; title: string }) {
  const acc = await db.socialAccount.findUnique({ where: { platform: "linkedin" } });
  if (!acc) return { ok: false, error: "not_connected" };
  if (acc.expiresAt && acc.expiresAt < new Date()) return { ok: false, error: "expired" };
  const r = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: { authorization: `Bearer ${acc.token}`, "content-type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
    body: JSON.stringify({
      author: `urn:li:person:${acc.accountId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: p.text },
          shareMediaCategory: "ARTICLE",
          media: [{ status: "READY", originalUrl: p.url, title: { text: p.title } }],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const error = r.ok ? null : (await r.text()).slice(0, 200);
  // آخر محاولة تُحفظ لتظهر في صفحة /connect
  await db.socialAccount.update({ where: { platform: "linkedin" }, data: { lastAt: new Date(), lastOk: r.ok, lastError: error } }).catch(() => {});
  return r.ok ? { ok: true } : { ok: false, error: error ?? "failed" };
}
