// منطق الحساب: الجواهر، وتجزئة كلمات المرور، ودمج التقدم بين الأجهزة
import { describe, expect, it } from "vitest";
import { gemsForSession, MIN_SESSION_QUESTIONS, GEM_RULES } from "@/lib/gems-rules";
import { hashPassword, verifyPassword } from "@/lib/password";
import { mergeProgress } from "@/lib/progress-sync";

describe("الجواهر", () => {
  it("لا جواهر لجلسة أقصر من الحد الأدنى", () => {
    expect(gemsForSession("practice", MIN_SESSION_QUESTIONS - 1, MIN_SESSION_QUESTIONS - 1)).toBe(0);
  });
  it("مكافأة الجلسة الكاملة أكبر من الجلسة العادية", () => {
    const n = MIN_SESSION_QUESTIONS + 2;
    expect(gemsForSession("practice", n, n)).toBe(GEM_RULES.session_complete.amount + GEM_RULES.session_perfect.amount);
    expect(gemsForSession("practice", n, n - 1)).toBe(GEM_RULES.session_complete.amount);
  });
});

describe("كلمات المرور", () => {
  it("تُتحقق الصحيحة وتُرفض الخاطئة", async () => {
    const h = await hashPassword("كلمة-سر-عربية-123");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("كلمة-سر-عربية-123", h)).toBe(true);
    expect(await verifyPassword("خطأ", h)).toBe(false);
    expect(await verifyPassword("أي شيء", null)).toBe(false);
  });
});

describe("دمج التقدم بين جهازين", () => {
  it("لا يضيع شيء من الطرفين، والأحدث يغلب", () => {
    const local = { attempts: { a: { ts: 2, ok: true } }, sessions: [{ id: "s1", ts: 1 }], xp: 50, best: { x: 70 }, onboarded: true } as never;
    const remote = { attempts: { a: { ts: 1, ok: false }, b: { ts: 5 } }, sessions: [{ id: "s2", ts: 3 }], xp: 80, best: { x: 90, y: 40 } } as never;
    const m = mergeProgress(local, remote) as Record<string, any>;
    expect(m.attempts.a.ts).toBe(2);
    expect(m.attempts.b).toBeTruthy();
    expect(m.sessions.map((s: { id: string }) => s.id)).toEqual(["s2", "s1"]);
    expect(m.xp).toBe(80);
    expect(m.best).toEqual({ x: 90, y: 40 });
    expect(m.onboarded).toBe(true);
  });
});
