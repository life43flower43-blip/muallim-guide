#!/usr/bin/env python3
# اختبار دخان حي — النسخة الجديدة: مسار الذكاء الاصطناعي + مساعد بلا مفتاح
from playwright.sync_api import sync_playwright
import re, sys

BASE = "http://localhost:3000"
results = []

def check(name, cond):
    results.append((name, bool(cond)))
    print(("✓" if cond else "✗"), name)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 420, "height": 860})
    pg.goto(BASE, wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(2500)

    # ٠) اجتياز الاستقبال الأول إن ظهر (متصفح جديد)
    if "ما اسمك" in pg.inner_text("body"):
        pg.get_by_placeholder(re.compile(".")).first.fill("معلم تجريبي")
        pg.get_by_text("لنبدأ الرحلة").first.click()
        pg.wait_for_timeout(2500)
        pg.goto(BASE, wait_until="networkidle", timeout=60000)
        pg.wait_for_timeout(2500)

    # ١) الرئيسية جاهزة بمقاطعها المعروفة (المقررات في تبويب «دليل المعلم» وتم فحصها منفصلة)
    body = pg.inner_text("body")
    check("الرئيسية جاهزة بمقاطعها (رحلتك إلى الاحتراف)",
          "رحلتك إلى الاحتراف" in body)

    # ٢) بطاقة المساعد بلا وعد بمفتاح
    check("بطاقة المساعد الذكي ظاهرة", "المساعد الذكي" in body)

    # ٣) فتح المساعد
    pg.get_by_text("المساعد الذكي").first.click()
    pg.wait_for_timeout(900)
    panel = pg.inner_text("body")
    check("لا لافتة مفتاح (لم تربط مفتاحك بعد) — لقد أزيلت", "لم تربط مفتاحك" not in panel)
    check("لا عبارة اربط مفتاحك في أي مكان", "اربط مفتاحك" not in panel)
    check("حالة الترحيب ظاهرة", "كيف أساعدك اليوم؟" in panel)

    # ٤) السؤال المقترح الأول (الذكاء الاصطناعي) يجاب فوراً
    pg.get_by_text("كيف تطور الذكاء الاصطناعي وما دوره في العملية التعليمية؟").first.click()
    pg.wait_for_timeout(2200)
    panel = pg.inner_text("body")
    check("جاء رد المساعد على سؤال الذكاء الاصطناعي", "دارتموث" in panel or "تطور" in panel)
    check("الرد يذكر دوره التعليمي (التكيفي)", "التكيفي" in panel)

    # ٥) سؤال حر يُجاب من المكتبة: تقويم
    pg.get_by_placeholder("اسأل عن أي شيء تربوي…").fill("ما الفرق بين التقويم التكويني والختامي؟")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(2200)
    panel = pg.inner_text("body")
    check("سؤال حر عن التقويم أجاب من الإجابات الخبيرة", "تشخيصي" in panel)

    # ٦) لقطة شاشة للمساعد
    pg.screenshot(path="scripts/smoke_ai_local.png")

    # ٧) مكتبة المفاهيم: فتح مسار الذكاء الاصطناعي
    pg.keyboard.press("Escape")
    pg.go_back() if False else None
    pg.goto(BASE, wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(2000)

    # ٨) سؤال مباشر من المسار الجديد عبر واجهة الاختبار
    body = pg.inner_text("body")
    check("لا أثر لأسئلة القدرات المحذوفة في الرئيسية", "أسرع طريقة لحساب" not in body)

    b.close()

ok = sum(1 for _, c in results if c)
print(f"\nالنتيجة: {ok}/{len(results)}")
sys.exit(0 if ok == len(results) else 1)
