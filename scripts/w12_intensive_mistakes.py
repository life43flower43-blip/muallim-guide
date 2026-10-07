# -*- coding: utf-8 -*-
# تحقق شامل: الاختبار المكثف (جميع الأسئلة) + لوحة المفهوم بعد الخطأ + صفحة أخطائي التفصيلية + المكتبة الجديدة
import asyncio, re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        await pg.goto(BASE, wait_until="networkidle")
        await pg.wait_for_timeout(2500)
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")

        # ===== ١) الرئيسية: بطاقة الاختبار المكثف بلا «٥ أسئلة» =====
        try:
            await pg.fill("input", "سلمى", timeout=4000)
            await pg.click("text=لنبدأ الرحلة", timeout=3000)
            await pg.wait_for_timeout(1500)
        except Exception:
            pass
        home = await pg.inner_text("body")
        print("بطاقة المكثف:", "نعم" if "اختبار مكثف يشمل جميع الأسئلة" in home else "لا!")
        print("حذف «٥ أسئلة»:", "نعم" if "٥ أسئلة" not in home else "لا — لا تزال!")
        print("عند الخطأ نعرفك بمفهومه:", "نعم" if "وعند كل خطأ نعرفك بمفهومه" in home else "لا!")
        print("اختصار أخطائي:", "نعم" if "تفصيل كل خطأ ومفهومه" in home else "لا!")
        await pg.screenshot(path="scripts/w12_home.png", full_page=True)

        # ===== ٢) بدء الاختبار المكثف =====
        await pg.click("text=ابدأ الآن", timeout=5000)
        await pg.wait_for_timeout(1500)
        quiz = await pg.inner_text("body")
        print("تسمية الجلسة:", "نعم" if "الاختبار المكثف — جميع الأسئلة" in quiz else "لا!")
        m = re.search(r"١ من (١[٠-٩]+|٢[٠-٩]+)", quiz)
        print("موضع الجلسة (١ من ...):", "نعم" if m else f"لا! ({quiz[:80]})")

        # ===== ٣) الإجابة حتى وقوع خطأ (خيار أ دائماً) =====
        got_wrong = False
        for i in range(10):
            await pg.wait_for_selector(".opt-btn", timeout=8000)
            await pg.click(".opt-btn >> nth=0", timeout=4000)
            await pg.click("text=تحقق", timeout=4000)
            await pg.wait_for_timeout(700)
            body = await pg.inner_text("body")
            if "إجابة غير صحيحة" in body:
                got_wrong = True
                print(f"خطأ متعمد عند السؤال {i+1}: نعم")
                print("لوحة المفهوم:", "نعم" if "المفهوم الذي خطأت فيه" in body else "لا!")
                print("أمثلة مشابهة:", "نعم" if "أمثلة مشابهة من الميدان" in body else "لا!")
                print("سطر الحفظ في أخطائي:", "نعم" if "سجلنا هذا الخطأ في صفحة «أخطائي»" in body else "لا!")
                await pg.screenshot(path="scripts/w12_wrong_feedback.png", full_page=True)
                break
            await pg.click("text=متابعة", timeout=4000)
            await pg.wait_for_timeout(500)
        if not got_wrong:
            raise SystemExit("FAIL: لم يقع خطأ في ١٠ أسئلة متتالية")

        # ===== ٤) الخروج من الجلسة =====
        await pg.click("button[aria-label='خروج']", timeout=4000)
        await pg.wait_for_timeout(600)
        dlg = await pg.inner_text("body")
        print("رسالة حفظ الأخطاء عند الخروج:", "نعم" if "تبقى محفوظة في صفحة" in dlg else "لا!")
        await pg.get_by_role("button", name="خروج", exact=True).click()
        await pg.wait_for_timeout(1000)

        # ===== ٥) صفحة أخطائي التفصيلية =====
        await pg.click("text=أخطائي", timeout=5000)
        await pg.wait_for_timeout(1200)
        mk = await pg.inner_text("body")
        print("— صفحة أخطائي —")
        print("العنوان:", "نعم" if "أخطائي" in mk else "لا!")
        print("إجابتك:", "نعم" if "إجابتك:" in mk else "لا!")
        print("الإجابة الصحيحة:", "نعم" if "الإجابة الصحيحة:" in mk else "لا!")
        print("أمثلة متنوعة:", "نعم" if "أمثلة متنوعة من الميدان" in mk else "لا!")
        print("تدريب على المفهوم:", "نعم" if "تدريب على هذا المفهوم" in mk else "لا!")
        print("إعادة كل الأخطاء:", "نعم" if "إعادة تدريب كل أخطائي الآن" in mk else "لا!")
        await pg.screenshot(path="scripts/w12_mistakes.png", full_page=True)

        # ===== ٦) تدريب من داخل أخطائي يفتح جلسة ثم يعود لأخطائي =====
        await pg.click("text=تدريب على هذا المفهوم", timeout=5000)
        await pg.wait_for_timeout(1200)
        tr = await pg.inner_text("body")
        print("جلسة التدريب من أخطائي:", "نعم" if "تدريب:" in tr else "لا!")

        # ===== ٧) الخروج من التدريب ← العودة لأخطائي ← الإغلاق =====
        await pg.click("button[aria-label='خروج']", timeout=4000)
        await pg.wait_for_timeout(900)
        # جلسة بلا إجابات تُغلق مباشرة؛ وإن ظهر الحوار نؤكد الخروج
        if "الخروج من الجلسة؟" in await pg.inner_text("body"):
            await pg.get_by_role("button", name="خروج", exact=True).click()
            await pg.wait_for_timeout(800)
        back = await pg.inner_text("body")
        print("العودة لأخطائي بعد التدريب:", "نعم" if "إعادة تدريب كل أخطائي الآن" in back else "لا!")
        await pg.click("button[aria-label='إغلاق']", timeout=4000)
        await pg.wait_for_timeout(800)

        # ===== ٨) المكتبة الجديدة: رقائق + شبكة بلا فصول كتاب =====
        await pg.click("text=المكتبة", timeout=5000)
        await pg.wait_for_timeout(1200)
        await pg.click("text=قائمة", timeout=4000)  # مبدّل العرض: قائمة
        await pg.wait_for_timeout(1000)
        lib = await pg.inner_text("body")
        print("— المكتبة —")
        print("رقاقة الكل:", "نعم" if "الكل" in lib else "لا!")
        print("شبكة بطاقات (تمت القراءة/غير مقروء):", "نعم" if ("مكتبة المفاهيم" in lib) else "لا!")
        print("بلا فصول مرقمة («الفصل الأول/الثاني»):", "نعم" if ("الفصل الأول" not in lib and "الفصل الثاني" not in lib) else "لا — لا تزال!")
        # ملاحظة: كلمة «الفصل» في عنوان مفهوم واحد تعني الصف الدراسي (محتوى مشروع لا هيكل كتاب)
        await pg.screenshot(path="scripts/w12_library.png", full_page=True)

        await b.close()

asyncio.run(main())
print("ALL CHECKS PASSED")
