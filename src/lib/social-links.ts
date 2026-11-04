// كل منصات تربوي في مكان واحد: تُستخدم في الموقع والتطبيق ومنشورات القنوات حتى تعلن كل منصة عن الأخرى.
// لينكدإن وX تظهران فقط حين يُضاف رابطهما في Vercel (NEXT_PUBLIC_LINKEDIN_URL / NEXT_PUBLIC_X_URL).
import { SITE_URL, FACEBOOK_URL, TELEGRAM_URL } from "@/lib/public-bank";

export type Platform = "site" | "app" | "telegram" | "facebook" | "linkedin" | "x";
export type SocialLink = { id: Platform; name: string; emoji: string; url: string; pitch: string };

export function socialLinks(): SocialLink[] {
  const all: (SocialLink | null)[] = [
    { id: "site", name: "الموقع", emoji: "🌐", url: SITE_URL, pitch: "شروح ومقالات ومقارنات" },
    { id: "app", name: "التطبيق", emoji: "📱", url: `${SITE_URL}/tatbeeq`, pitch: "آلاف الأسئلة ومحاكي الاختبار" },
    { id: "telegram", name: "تيليجرام", emoji: "✈️", url: TELEGRAM_URL, pitch: "معلومة وسؤالان كل يوم" },
    { id: "facebook", name: "فيسبوك", emoji: "📘", url: FACEBOOK_URL, pitch: "أسئلة ونقاشات المعلمين" },
    process.env.NEXT_PUBLIC_LINKEDIN_URL ? { id: "linkedin", name: "لينكدإن", emoji: "💼", url: process.env.NEXT_PUBLIC_LINKEDIN_URL, pitch: "مقالات للتطوير المهني" } : null,
    process.env.NEXT_PUBLIC_X_URL ? { id: "x", name: "X", emoji: "✖️", url: process.env.NEXT_PUBLIC_X_URL, pitch: "فائدة سريعة كل يوم" } : null,
  ];
  return all.filter((x): x is SocialLink => !!x);
}

/** منشور «كل منصاتنا» لمنصة معينة: يذكر المنصات الأخرى فقط */
export function crossPromo(from: Platform, html = false) {
  const others = socialLinks().filter((s) => s.id !== from);
  const line = (s: SocialLink) => (html ? `${s.emoji} <b>${s.name}:</b> ${s.pitch}\n<a href="${s.url}">${s.url.replace(/^https?:\/\//, "")}</a>` : `${s.emoji} ${s.name}: ${s.pitch}\n${s.url}`);
  const head = html ? "🤝 <b>تربوي في كل مكان</b>" : "🤝 تربوي في كل مكان";
  return `${head}\n\nاستعدادك للرخصة المهنية لا يتوقف هنا. تابعنا حيث تحب:\n\n${others.map(line).join("\n\n")}`;
}

/** سطر قصير في ذيل المنشور يدل على المنصات الأخرى */
export function footerLine(from: Platform) {
  const pick = socialLinks().filter((s) => s.id !== from && (s.id === "app" || s.id === "telegram" || s.id === "site")).slice(0, 2);
  return pick.map((s) => `${s.emoji} ${s.name}: ${s.url}`).join("\n");
}
