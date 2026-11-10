// النشر الآلي في X (تويتر) عبر API v2 بتوقيع OAuth 1.0a.
// المفاتيح الأربعة من بوابة المطورين (لا تنتهي صلاحيتها): X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
import { createHmac, randomBytes } from "crypto";
import { SITE_URL } from "@/lib/public-bank";
import { allArticles, todayISO } from "@/lib/articles";
import { dayNumber, dayPlan, SLOTS, type Slot } from "@/lib/telegram";
import { socialLinks } from "@/lib/social-links";

export const xConfigured = () => ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"].every((k) => !!process.env[k]);

const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

function oauthHeader(method: string, url: string) {
  const p: Record<string, string> = {
    oauth_consumer_key: process.env.X_API_KEY!,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: process.env.X_ACCESS_TOKEN!,
    oauth_version: "1.0",
  };
  // جسم JSON لا يدخل في التوقيع
  const base = [method, enc(url), enc(Object.keys(p).sort().map((k) => `${enc(k)}=${enc(p[k])}`).join("&"))].join("&");
  const key = `${enc(process.env.X_API_SECRET!)}&${enc(process.env.X_ACCESS_SECRET!)}`;
  p.oauth_signature = createHmac("sha1", key).update(base).digest("base64");
  return "OAuth " + Object.keys(p).sort().map((k) => `${enc(k)}="${enc(p[k])}"`).join(", ");
}

// طول التغريدة كما يحسبه X: الرابط ٢٣ حرفًا، والرموز التعبيرية حرفان
const LIMIT = 280;
const weight = (t: string) => {
  let n = 0;
  for (const part of t.split(/(https?:\/\/\S+)/)) {
    if (/^https?:\/\//.test(part)) { n += 23; continue; }
    for (const ch of part) n += (ch.codePointAt(0) ?? 0) > 0x2fff ? 2 : 1;
  }
  return n;
};
/** يقص الجزء الأوسط حتى تدخل التغريدة في الحد */
function fit(head: string, body: string, tail: string) {
  let b = body;
  while (b && weight(`${head}${b}${tail}`) > LIMIT) b = b.slice(0, Math.max(0, b.length - 8)).replace(/\s+\S*$/, "") + "…";
  return `${head}${b}${tail}`;
}

const TAGS = ["#الرخصة_المهنية", "#اختبار_المعلمين", "#تربوي", "#معلمين_السعودية", "#الاختبار_التربوي_العام", "#سؤال_اليوم", "#معلومة_تربوية", "#تطبيق_تربوي"];
const tags = (n: number) => `${TAGS[n % TAGS.length]} ${TAGS[(n + 3) % TAGS.length]}`;

export function buildXPost(iso = todayISO(), slot: Slot): string | null {
  const plan = dayPlan(iso);
  const n = dayNumber(iso) * 4 + SLOTS.indexOf(slot);
  const t = `\n\n${tags(n)}`;
  if (slot === "tip") {
    const art = allArticles().find((a) => a.date === iso);
    if (art) return fit(`🆕 ${art.title}\n\n`, art.description, `\n${SITE_URL}/articles/${art.slug}${t}`);
    if (!plan.tip) return null;
    return fit(`💡 ${plan.tip.title}\n\n`, plan.tip.text, `\n${SITE_URL}${plan.tip.href}${t}`);
  }
  if (slot === "promo" && new Date(iso + "T12:00:00Z").getUTCDay() === 5) {
    const links = socialLinks().filter((s) => s.id !== "x" && s.id !== "site").slice(0, 3);
    return fit("🤝 تابع تربوي في كل منصاته:\n", "", `\n${links.map((s) => `${s.emoji} ${s.name} ${s.url}`).join("\n")}${t}`);
  }
  if (slot === "promo" && plan.promo) return fit(plan.promo.kind === "app" ? "📱 " : "🌐 ", plan.promo.text, `\n${SITE_URL}${plan.promo.href}${t}`);
  if (slot === "q1" || slot === "q2") {
    const q = plan.qs[slot === "q1" ? 0 : 1];
    if (!q) return null;
    return fit("❓ ", q.q, `\n\nالخيارات والإجابة مع الشرح 👇\n${SITE_URL}${q.href}${t}`);
  }
  return null;
}

export async function postToX(text: string) {
  const url = "https://api.x.com/2/tweets";
  const r = await fetch(url, { signal: AbortSignal.timeout(15000), method: "POST", headers: { authorization: oauthHeader("POST", url), "content-type": "application/json" }, body: JSON.stringify({ text }) });
  return r.ok ? { ok: true } : { ok: false, error: (await r.text()).slice(0, 200) };
}
