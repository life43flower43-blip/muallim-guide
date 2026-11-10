// صلاحية صاحب الموقع لصفحة /connect وروابط ربط المنصات: مفتاح ADMIN_KEY (أو CRON_SECRET) في كوكي محمي
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "turbawy_admin";
const adminKey = () => (process.env.ADMIN_KEY || process.env.CRON_SECRET || "").trim();
const digest = (s: string) => createHash("sha256").update(`turbawy-admin:${s}`).digest();

/** القيمة المحفوظة في الكوكي: بصمة المفتاح لا المفتاح نفسه */
export const adminToken = (key: string) => digest(key).toString("hex");

export function adminConfigured(): boolean {
  return adminKey().length >= 16;
}

export function keyMatches(input: string): boolean {
  const k = adminKey();
  if (k.length < 16 || !input) return false;
  return timingSafeEqual(digest(input), digest(k));
}

export async function isAdmin(): Promise<boolean> {
  const k = adminKey();
  if (k.length < 16) return false;
  const v = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  const want = adminToken(k);
  return v.length === want.length && timingSafeEqual(Buffer.from(v), Buffer.from(want));
}
