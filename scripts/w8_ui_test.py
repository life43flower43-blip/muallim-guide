# -*- coding: utf-8 -*-
"""
Task 21-a — اختبار متصفح للواجهة الجديدة (نقد البنود 1-11)
390×844: الرئيسية بالترتيب الجديد، الشريط السفلي، جلسة اليوم، زر أبلغ عن خطأ (ويبقى بعد إعادة التحميل)، لقطات.
"""
import re
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
W, H = 390, 844
SHOTS = "/home/z/my-project/scripts"

results = []

def check(name, cond, extra=""):
    results.append((name, bool(cond), extra))
    print(("PASS  " if cond else "FAIL  ") + name + ((" — " + extra) if extra else ""))

def pick_and_grade(page):
    """يختار أول خيار متاح ثم يضغط «تحقق» — يعيد True إن نجح"""
    opt = page.locator("div.space-y-3 > button").first
    if opt.count() == 0:
        opt = page.locator("div.grid.grid-cols-2 > button").first
    if opt.count() == 0:
        return False
    opt.click()
    page.wait_for_timeout(250)
    grade = page.get_by_role("button", name=re.compile("تحقق|تأكيد الاختيار"))
    if grade.count() == 0:
        return False
    grade.first.click()
    page.wait_for_timeout(650)
    return True

def press_next(page):
    nxt = page.get_by_role("button", name=re.compile("متابعة|عرض النتيجة"))
    if nxt.count() > 0:
        nxt.first.click()
        page.wait_for_timeout(450)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=2)
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    def hide_dev_overlay():
        # إخفاء بوابة أدوات تطوير Next حتى لا تعترض النقر فوق الشريط السفلي
        page.add_style_tag(content="nextjs-portal{display:none !important; pointer-events:none !important}")

    # فتح التطبيق
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(1200)
    hide_dev_overlay()

    # إن كنا في شاشة الترحيب الأولى: أدخل اسمًا وابدأ
    if page.get_by_text("ما اسمك يا معلم المستقبل؟").count() > 0:
        page.get_by_placeholder("اكتب اسمك هنا").fill("سلمى")
        page.get_by_role("button", name="لنبدأ الرحلة").click()
        page.wait_for_timeout(800)

    # (1) الرئيسية: الترتيب الجديد والتباين
    page.wait_for_selector("text=ابدأ جلسة اليوم", timeout=8000)
    body = page.inner_text("body")
    check("الترحيب مدمج داخل الصفحة (اسم المستخدم)", page.get_by_text("سلمى").count() > 0)
    check("رقاقة streak بتلميح «أيام متتالية»", "أيام متتالية" in body)
    check("رقاقة الجواهر مع سطر الاقتصاد", "تكتسبها من الجلسات وتصرفها في متجر الجنية" in body)
    check("بطاقة الجلسة: «10 دقائق: 5 أسئلة + مفهوم + موقف»", "10 دقائق: 5 أسئلة + مفهوم + موقف" in body)
    check("هدف اليوم بالنقاط", re.search(r"هدف اليوم: 0/40 نقطة", body) is not None)
    check("الاختصارات: سريع/مراجعة ذكية/أخطائي", all(x in body for x in ["سريع", "مراجعة ذكية", "أخطائي"]))
    check("أكمل من حيث توقفت/ابدأ رحلتك", ("أكمل من حيث توقفت" in body) or ("ابدأ رحلتك" in body))
    check("مفهوم اليوم مع «اقرأ المزيد»", "مفهوم اليوم" in body and "اقرأ المزيد" in body)
    check("رحلتك إلى الاحتراف كرقائق (أنت هنا)", "رحلتك إلى الاحتراف" in body and "أنت هنا" in body)
    check("شارة منشئ الخطط: قيد البناء", "منشئ الخطط: قيد البناء" in body)
    check("بطاقة التقدم: صفان بعنوانين", "تقدمك في المكتبة" in body and "دقة إجاباتك" in body)
    check("عتبة الدقة: «تُظهر الدقة بعد 10 أسئلة»", "تُظهر الدقة بعد 10 أسئلة" in body)
    check("لا تكرار: لا بطاقات عوالم كاملة/نص رحلة مكرر", "يتدرّب ميدانياً" not in body)
    chips = page.locator("section").filter(has_text="رحلتك إلى الاحتراف").inner_text()
    check("صيغة الجمع: «15 موقفًا»", "15 موقفًا" in chips, chips.replace("\n", " ")[:120])

    page.screenshot(path=f"{SHOTS}/w8_home.png", full_page=True)

    # (2) الشريط السفلي: المكتبة / تدريب / حسابي / والعودة
    nav = page.get_by_role("navigation", name="التنقل الرئيسي")
    check("الشريط السفلي موجود", nav.count() > 0)

    def nav_click(label):
        hide_dev_overlay()
        nav.get_by_role("button", name=label).click(force=True)
        page.wait_for_timeout(700)

    nav_click("المكتبة")
    check("المكتبة تفتح ConceptsView", page.get_by_text("مكتبة المفاهيم").count() > 0 or page.get_by_text("بطاقات").count() > 0)
    page.screenshot(path=f"{SHOTS}/w8_tabbar_library.png")

    nav_click("حسابي")
    check("حسابي يفتح AccountView", page.get_by_text("الإنجازات").count() > 0)
    check("حسابي: الدقة تظهر «—» قبل 10 أسئلة", "تُظهر دقتك بعد 10 أسئلة" in page.inner_text("body"))

    nav_click("تدريب")
    check("تدريب يفتح محاكاة الصف", page.get_by_text("محاكاة الصف الدراسي").count() > 0)
    page.screenshot(path=f"{SHOTS}/w8_tabbar.png")
    hide_dev_overlay()
    page.get_by_role("button", name="إغلاق").click(force=True)
    page.wait_for_timeout(600)

    nav_click("الرئيسية")
    check("العودة للرئيسية عبر الشريط", page.get_by_text("ابدأ جلسة اليوم").count() > 0)

    # (3) ابدأ جلسة اليوم — ونلتقط عنوان مفهوم السؤال الأول للتحقق اللاحق
    page.get_by_role("button", name="ابدأ الآن").click()
    page.wait_for_timeout(1000)
    body = page.inner_text("body")
    check("جلسة اليوم تعمل (سؤال ظاهر)", "جلسة اليوم — 10 دقائق" in body and ("تحقق" in body or "تأكيد الاختيار" in body))

    concept_chip = page.locator("span.rounded-full.bg-muted").last
    concept_title = concept_chip.inner_text().strip() if concept_chip.count() > 0 else ""
    check("التقط عنوان مفهوم السؤال الأول", len(concept_title) > 2, concept_title)

    # أجب عن سؤالين — الأول يُبلَّغ عنه
    for i in range(2):
        page.wait_for_timeout(350)
        if not pick_and_grade(page):
            break
        if i == 0:
            report_btn = page.get_by_role("button", name="أبلغ عن خطأ")
            check("زر «أبلغ عن خطأ» ظاهر بعد الإجابة", report_btn.count() > 0)
            report_btn.click()
            page.wait_for_timeout(600)
            check("toast الشكر ظهر", "شكرًا — سيُراجع السؤال" in page.inner_text("body"))
            check("الزر تحول إلى «تم الإبلاغ»", "تم الإبلاغ عن هذا السؤال" in page.inner_text("body"))
        press_next(page)

    # (4) الإبلاغ يُحفظ في المخزن الدائم
    reported = page.evaluate(
        "JSON.parse(localStorage.getItem('turbawy-app-v1') || '{}').state?.reportedQuestions || []"
    )
    check("الإبلاغ محفوظ في المخزن الدائم", len(reported) >= 1, str(reported))
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1200)
    hide_dev_overlay()

    reported_after = page.evaluate(
        "JSON.parse(localStorage.getItem('turbawy-app-v1') || '{}').state?.reportedQuestions || []"
    )
    check("الإبلاغ باقٍ بعد إعادة التحميل", reported == reported_after and len(reported) >= 1, str(reported_after))

    # بعد إعادة التحميل: افتح تدريب مفهوم السؤال المُبلَّغ عنه — يجب أن يظهر «تم الإبلاغ» بلا زر
    nav_click("المكتبة")
    page.get_by_placeholder(re.compile("ابحث في")).fill(concept_title)
    page.wait_for_timeout(600)
    first_result = page.locator("button").filter(has_text=concept_title).first
    check("بحث المكتبة يجد المفهوم", first_result.count() > 0, concept_title)
    if first_result.count() > 0:
        first_result.click()
        page.wait_for_timeout(700)
        page.get_by_role("button", name="تدريب على هذا المفهوم").click()
        page.wait_for_timeout(900)
        found_reported_state = False
        for i in range(3):
            page.wait_for_timeout(350)
            if not pick_and_grade(page):
                break
            has_reported = "تم الإبلاغ عن هذا السؤال" in page.inner_text("body")
            has_button = page.get_by_role("button", name="أبلغ عن خطأ").count() > 0
            if has_reported and not has_button:
                found_reported_state = True
                break
            press_next(page)
        check("بعد إعادة التحميل: السؤال المُبلَّغ عنه يبقى مُبلَّغًا", found_reported_state)
        page.screenshot(path=f"{SHOTS}/w8_report_button.png")

    # حصة أخيرة: الرئيسية بعد كل شيء
    hide_dev_overlay()
    browser.close()

print("\n--- ملخص ---")
fails = [r for r in results if not r[1]]
print(f"إجمالي: {len(results)} | ناجح: {len(results) - len(fails)} | فاشل: {len(fails)}")
if errors:
    print("أخطاء وحدة التحكم:")
    for e in errors[:10]:
        print("  ", e)
sys.exit(1 if fails else 0)
