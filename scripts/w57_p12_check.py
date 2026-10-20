# -*- coding: utf-8 -*-
"""P12 — فحص متصفحي شامل لإعادة التوزيع: الرئيسية المصغرة، التبويبات الجديدة، قلب الصف، الثنائية اللونية."""
import re, sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
CJK = re.compile(r'[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff01-\uff5e]')
LAT = re.compile(r'[A-Za-z]')
GREEN = re.compile(r'#1B4332|#2D6A4F|#52B788|#14532D|#0B2018', re.I)

results = []
def ok(name, cond, extra=""):
    results.append((bool(cond), name, extra))
    print(("✓" if cond else "✗"), name, ("— " + str(extra) if extra and not cond else ""))

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 420, "height": 860})
    pg.goto(BASE, timeout=30000)
    pg.wait_for_timeout(2200)
    try: pg.add_style_tag(content="nextjs-portal{display:none!important;pointer-events:none!important}")
    except Exception: pass

    if pg.locator("input").first.is_visible():
        try: pg.fill("input", "سارة")
        except Exception: pass
        try: pg.click('button:has-text("لنبدأ الرحلة")', timeout=4000)
        except Exception: pass
        pg.wait_for_timeout(1200)

    # ===== الرئيسية =====
    body = pg.inner_text("body")
    ok("الرئيسية: تحية ظاهرة", "يا معلم المستقبل" in body or "صباح الخير" in body or "مساء الخير" in body or "طاب نهارك" in body)
    ok("الرئيسية: سلسلة برقم أو بداية", ("سلسلة المواصلة" in body))
    ok("الرئيسية: بطاقة الاختبار موجودة", "ابدأ الاختبار" in body)
    ok("الرئيسية: أداتان فقط (استوديو+ميدان)", "استوديو خطط الدروس" in body and "سجل التدريب الميداني" in body)
    ok("الرئيسية: المختبر انتقل منها", "مختبر المعلّم" not in body)
    ok("الرئيسية: رحلة الاحتراف موجودة", "رحلتك إلى الاحتراف" in body)
    ok("الرئيسية: رابط حسابي مختصر", "حسابي" in body)
    # عدد الكتل البصرية العليا: أبناء عمود المحتوى المباشرون (ليس كل الأزرار الداخلية)
    n_blocks = pg.evaluate("""() => {
      const col = document.querySelector('main .relative.z-10');
      if (!col) return -1;
      return col.children.length;
    }""")
    ok("الرئيسية: كتل قليلة (≤ ٥ أقسام)", 0 < n_blocks <= 5, f"أقسام={n_blocks}")
    ok("الرئيسية: بلا CJK ولا لاتيني", not CJK.search(body) and not LAT.findall(body), "".join(LAT.findall(body)[:8]))
    ok("الرئيسية: بلا ألوان خضراء ثابتة", not GREEN.search(pg.content()))
    pg.screenshot(path="scripts/w57_home.png")

    # ===== شريط التنقل =====
    ok("التبويب: دليل المعلم", pg.locator('button[aria-label="دليل المعلم"]').count() == 1)
    ok("التبويب: الاختبارات", pg.locator('button[aria-label="الاختبارات"]').count() == 1)
    ok("التبويب: لا «المكتبة» ولا «تدريب»", pg.locator('button[aria-label="المكتبة"]').count() == 0 and pg.locator('button[aria-label="تدريب"]').count() == 0)

    # ===== الاختبارات (تبويب) =====
    pg.click('button[aria-label="الاختبارات"]'); pg.wait_for_timeout(1500)
    body = pg.inner_text("body")
    ok("الاختبارات: مركز الاختبارات", "مركز الاختبارات" in body)
    ok("الاختبارات: أدوات الممارسة ظهرت", "أدوات الممارسة" in body)
    for t in ["مختبر المعلّم", "الصف الحي", "سجل التدريب الميداني", "استوديو خطط الدروس"]:
        ok(f"الاختبارات: {t} موجود", t in body)
    ok("الاختبارات: نظافة نصية", not CJK.search(body) and not LAT.findall(body), "".join(LAT.findall(body)[:8]))
    pg.screenshot(path="scripts/w57_quiz_tab.png")

    # فتح المختبر من التبويب
    pg.locator('button:has-text("مختبر المعلّم")').first.click(); pg.wait_for_timeout(1500)
    ok("المختبر يفتح من الاختبارات", pg.locator('button[aria-label="إغلاق"]').count() >= 1)
    pg.click('button[aria-label="إغلاق"]').first if False else None
    # إغلاق الطبقة (زر الإغلاق الأول الظاهر)
    try:
        pg.locator('button[aria-label="إغلاق"]').first.click(timeout=3000)
        pg.wait_for_timeout(800)
    except Exception:
        pg.click('button[aria-label="الرئيسية"]'); pg.wait_for_timeout(600); pg.click('button[aria-label="الاختبارات"]'); pg.wait_for_timeout(800)

    # ===== دليل المعلم + قلب الصف =====
    pg.click('button[aria-label="دليل المعلم"]'); pg.wait_for_timeout(1500)
    body = pg.inner_text("body")
    ok("الدليل: قلب الصف بالأعلى", "قلب الصف" in body and "سلّم المشاعر" in body)
    pg.screenshot(path="scripts/w57_library.png")

    pg.locator('button:has-text("قلب الصف")').first.click(); pg.wait_for_timeout(1600)
    body = pg.inner_text("body")
    ok("قلب الصف: تبويبا السلّم والشرارة", "سلّم المشاعر التربوي" in body and "شرارة المبدع" in body)
    ok("قلب الصف: عائلات السلّم ظاهرة", "عائلة الخوف" in body and "عائلة الطاقة" in body and "عائلة القلوب" in body)
    pg.screenshot(path="scripts/w57_heart_ladder.png")

    # شخصية قابلة للفتح
    pg.locator('button:has-text("الخائف الصامت")').first.click(); pg.wait_for_timeout(900)
    body = pg.inner_text("body")
    ok("قلب الصف: تفاصيل الشخصية تفتح", "ما يدور في داخله" in body and "خطوات عملية" in body and "عبارة تقولها له" in body)

    # شرارة المبدع
    pg.locator('button:has-text("شرارة المبدع")').first.click(); pg.wait_for_timeout(900)
    s1 = pg.inner_text("body")
    ok("الشرارة: فكرة ظاهرة", "شرارة أخرى" in s1)
    pg.locator('button:has-text("شرارة أخرى")').first.click(); pg.wait_for_timeout(700)
    s2 = pg.inner_text("body")
    ok("الشرارة: تتغير بضغطة أخرى", s1 != s2)
    ok("قلب الصف: نظافة نصية", not CJK.search(s2) and not LAT.findall(s2), "".join(LAT.findall(s2)[:8]))
    pg.screenshot(path="scripts/w57_heart_spark.png")

    pg.locator('button[aria-label="إغلاق"]').first.click(); pg.wait_for_timeout(700)

    # ===== حسابي: لوحة التقدم =====
    pg.click('button[aria-label="حسابي"]'); pg.wait_for_timeout(1400)
    body = pg.inner_text("body")
    ok("حسابي: لوحة تقدم/محطات", ("التقدم" in body) or ("محطات" in body) or ("الرحلة" in body))
    pg.screenshot(path="scripts/w57_account.png")

    b.close()

fails = [r for r in results if not r[0]]
print(f"\n=== النتيجة: {len(results)-len(fails)}/{len(results)} ===")
sys.exit(1 if fails else 0)
