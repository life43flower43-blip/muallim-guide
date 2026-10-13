# -*- coding: utf-8 -*-
"""P12-browser — فحص متصفحي للميزات الجديدة: محاكي الرخصة، تحديد المستوى، المطابقة، السباق، البطاقات.
لكل شاشة: صفر CJK وصفر لاتيني ظاهر + لقطات."""
import re, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
CJK = re.compile(r"[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff01-\uff5e]")
LAT = re.compile(r"[A-Za-z]")

results = []
def ok(name, cond, extra=""):
    results.append((bool(cond), name, extra))
    print(("✓" if cond else "✗"), name, ("— " + str(extra) if extra and not cond else ""))

def scan(pg, label):
    layers = pg.locator("div.fixed.inset-0.z-50")
    body = layers.last.inner_text() if layers.count() > 0 else pg.inner_text("body")
    cjk = CJK.findall(body)
    lat = LAT.findall(body)
    ok(f"{label}: بلا CJK", not cjk, "".join(cjk[:8]))
    ok(f"{label}: بلا لاتيني ظاهر", not lat, "".join(lat[:12]))
    return body

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 420, "height": 880})
    pg.goto(BASE, timeout=30000)
    pg.wait_for_timeout(2000)
    try: pg.add_style_tag(content="nextjs-portal{display:none!important;pointer-events:none!important}")
    except Exception: pass

    # إعداد أولي
    if pg.locator("input").first.is_visible():
        try: pg.fill("input", "سارة")
        except Exception: pass
        try: pg.click('button:has-text("لنبدأ الرحلة")', timeout=4000)
        except Exception: pass
        pg.wait_for_timeout(1000)

    # ===== الاختبارات → المحاكي =====
    pg.click('button[aria-label="الاختبارات"]'); pg.wait_for_timeout(1200)
    body = scan(pg, "مركز الاختبارات")
    ok("المركز: بطاقة المحاكي ظاهرة", "محاكي الرخصة والمسابقات" in body)
    ok("المركز: تحديد المستوى ظاهر", "اختبار تحديد المستوى" in body)
    ok("المركز: البطاقات ظاهرة", "بطاقات المفاهيم" in body)
    ok("المركز: المطابقة ظاهرة", "لعبة المطابقة" in body)
    ok("المركز: السباق ظاهر", "سباق السرعة" in body)
    pg.screenshot(path="scripts/w58_quizhome.png")

    # ===== فتح المحاكي =====
    pg.click('button:has-text("محاكي الرخصة والمسابقات")'); pg.wait_for_timeout(900)
    body = scan(pg, "المحاكي — الرئيسية")
    ok("المحاكي: ثلاث بلاتنات", "اختبار التربوي العام" in body and "اختبار التخصص — التدريس" in body and "مسابقة الكادر الشاملة" in body)
    ok("المحاكي: سجل المحاولات", "سجل محاولاتك" in body)
    pg.screenshot(path="scripts/w58_examsim_home.png")

    # اختيار بلاتنة التخصص (٣٠ سؤالاً)
    pg.click('button:has-text("اختبار التخصص — التدريس")'); pg.wait_for_timeout(700)
    body = scan(pg, "المحاكي — التعليمات")
    ok("التعليمات: قواعد المحاكاة", "قواعد المحاكاة" in body)
    ok("التعليمات: حد النجاح", "حد النجاح" in body)
    pg.screenshot(path="scripts/w58_examsim_brief.png")

    pg.click('button:has-text("ابدأ المحاكاة الآن")'); pg.wait_for_timeout(900)
    body = scan(pg, "المحاكي — شاشة الحل")
    ok("الحل: مؤقت ظاهر", ":" in body)
    ok("الحل: شريط قسم", "التدريس" in body)

    # الإجابة عن أول ٣ أسئلة
    for i in range(3):
        opts = pg.locator("button.flex.w-full.items-center.gap-3.rounded-2xl")
        opts.first.click(); pg.wait_for_timeout(250)
        if i < 2:
            pg.click('button:has-text("التالي")'); pg.wait_for_timeout(300)
    ok("الحل: عدّاد الإجابات", "أجبت عن ٣" in pg.inner_text("body"))
    pg.screenshot(path="scripts/w58_examsim_run.png")

    # لوحة الأسئلة → القفز للسؤال الأخير → تسليم
    pg.locator('button[aria-label="لوحة الأسئلة"]').click(); pg.wait_for_timeout(500)
    pg.screenshot(path="scripts/w58_examsim_palette.png")
    pg.locator("div.grid.grid-cols-8 button").last.click(); pg.wait_for_timeout(500)
    pg.click('button:has-text("سلّم الاختبار")'); pg.wait_for_timeout(500)
    body = pg.inner_text("body")
    ok("التسليم: تأكيد بعدّ الأسئلة", "دون إجابة وستُحسب خطأً" in body)
    pg.screenshot(path="scripts/w58_examsim_confirm.png")
    pg.click('button:has-text("سلّم الآن")'); pg.wait_for_timeout(1200)
    body = scan(pg, "المحاكي — النتيجة")
    ok("النتيجة: درجة مئوية", "٪" in body)
    ok("النتيجة: تحليل الأقسام", "تحليل الأقسام" in body)
    ok("النتيجة: أخطاء مع الأسباب", "أخطاؤك" in body)
    ok("النتيجة: زر التدريب على الأخطاء", "تدرّب الآن على أخطائك" in body)
    pg.screenshot(path="scripts/w58_examsim_result.png")

    # ===== تحديد المستوى =====
    pg.click('button[aria-label="إنهاء"]'); pg.wait_for_timeout(600)
    pg.click('button:has-text("اختبار تحديد المستوى")'); pg.wait_for_timeout(800)
    body = scan(pg, "تحديد المستوى — البداية")
    for i in range(24):
        body = pg.locator("div.fixed.inset-0.z-50").last.inner_text()
        if "أداؤك على المحاور" in body:
            break
        opts = pg.locator("button.flex.w-full.items-center.gap-3.rounded-2xl")
        if opts.count() > 0:
            opts.nth(1).click()
        pg.wait_for_timeout(500)
    pg.wait_for_timeout(800)
    body = scan(pg, "تحديد المستوى — النتيجة")
    ok("التحديد: مستوى ظاهر", "بادئ في المسار" in body or "نامٍ ومتقدم" in body or "جاهز للاحتراف" in body)
    ok("التحديد: قوة وفجوات", "نقاط قوتك" in body and "فجواتك" in body)
    ok("التحديد: خطة تنفيذية", "خطتك المقترحة الآن" in body)
    pg.screenshot(path="scripts/w58_placement_result.png")
    pg.click('button[aria-label="إنهاء"]'); pg.wait_for_timeout(400)

    # ===== لعبة المطابقة =====
    pg.click('button[aria-label="الاختبارات"]'); pg.wait_for_timeout(700)
    pg.click('button:has-text("لعبة المطابقة")'); pg.wait_for_timeout(900)
    body = scan(pg, "المطابقة")
    ok("المطابقة: ١٢ بلاطة", pg.locator("div.grid.grid-cols-3 > button").count() == 12)
    ok("المطابقة: عدادات", "ثانية" in body and "خطأ" in body)
    # لمستان لاختبار المنطق
    pg.locator("div.grid.grid-cols-3 > button").first.click(); pg.wait_for_timeout(300)
    pg.locator("div.grid.grid-cols-3 > button").nth(1).click(); pg.wait_for_timeout(700)
    pg.screenshot(path="scripts/w58_match.png")

    # ===== سباق السرعة =====
    pg.click('button[aria-label="إغلاق اللعبة"]'); pg.wait_for_timeout(500)
    pg.click('button:has-text("سباق السرعة")'); pg.wait_for_timeout(900)
    body = scan(pg, "السباق")
    ok("السباق: عداد نقاط", "نقاط" in pg.inner_text("body") or "٢٠" in body)
    ok("السباق: مؤقت السؤال", "ثانية" in body)
    opts = pg.locator("button.flex.w-full.items-center.gap-3.rounded-2xl")
    if opts.count() > 0:
        opts.first.click(); pg.wait_for_timeout(600)
    pg.screenshot(path="scripts/w58_speed.png")

    # ===== بطاقات المفاهيم =====
    pg.click('button[aria-label="إنهاء السباق"]'); pg.wait_for_timeout(500)
    pg.click('button:has-text("بطاقات المفاهيم")'); pg.wait_for_timeout(1000)
    body = scan(pg, "البطاقات")
    ok("البطاقات: بطاقة قابلة للقلب", "اضغط البطاقة لقلبها" in body)
    pg.screenshot(path="scripts/w58_flashcards.png")
    pg.click('button[aria-label="إغلاق البطاقات"]'); pg.wait_for_timeout(400)

    b.close()

passed = sum(1 for r in results if r[0])
print(f"\n===== {passed}/{len(results)} نجاح =====")
sys.exit(0 if passed == len(results) else 1)
