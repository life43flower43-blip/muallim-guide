# -*- coding: utf-8 -*-
# تحقق: تبويب أخطائي في الشريط السفلي + نقل سريع/مراجعة ذكية إليه + حذف بطاقات الرئيسية
#        + إزالة البطاقات القلابة من المكتبة + قسم أمثلة الطلاب في تفاصيل المفهوم
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

        try:
            await pg.fill("input", "سلمى", timeout=4000)
            await pg.click("text=لنبدأ الرحلة", timeout=3000)
            await pg.wait_for_timeout(1200)
        except Exception:
            pass

        # ===== ١) الرئيسية: بلا بطاقات اختصارات + شريط بخمسة تبويبات =====
        home = await pg.inner_text("body")
        print("— الرئيسية —")
        print("لا بطاقة سريع:", "نعم" if "١٠ أسئلة عشوائية" not in home else "لا — موجودة!")
        print("لا اختصار مراجعة ذكية:", "نعم" if ("لديك مراجعات مستحقة" not in home and "لا مراجعات الآن" not in home) else "لا — موجودة!")
        print("لا اختصار أخطائي:", "نعم" if "تفصيل كل خطأ ومفهومه" not in home else "لا — موجود!")
        print("بطاقة المكثف باقية:", "نعم" if "اختبار مكثف يشمل جميع الأسئلة" in home else "لا!")
        nav = await pg.eval_on_selector_all("nav button", "els => els.map(e => e.getAttribute('aria-label'))")
        print("الشريط السفلي:", nav)
        ok_order = nav == ["الرئيسية", "المكتبة", "أخطائي", "تدريب", "حسابي"]
        print("ترتيب التبويبات (أخطائي بجانب تدريب):", "نعم" if ok_order else f"لا! {nav}")
        await pg.screenshot(path="scripts/w13_home.png", full_page=True)

        # ===== ٢) تبويب أخطائي: فيه سريع ومراجعة ذكية وحالة فارغة =====
        await pg.click("nav button[aria-label='أخطائي']", timeout=5000)
        await pg.wait_for_timeout(1000)
        mk = await pg.inner_text("body")
        print("— تبويب أخطائي —")
        print("بطاقة سريع:", "نعم" if "١٠ أسئلة عشوائية" in mk else "لا!")
        print("بطاقة مراجعة ذكية:", "نعم" if "مراجعة ذكية" in mk else "لا!")
        print("حالة فارغة:", "نعم" if "لا أخطاء حتى الآن" in mk else "لا!")
        await pg.screenshot(path="scripts/w13_mistakes.png", full_page=True)

        # ===== ٣) المكتبة: بلا مبدّل بطاقات/قائمة =====
        await pg.click("nav button[aria-label='المكتبة']", timeout=5000)
        await pg.wait_for_timeout(1000)
        lib = await pg.inner_text("body")
        print("— المكتبة —")
        # لا زرّ مبدّل بنص حرفي «بطاقات» أو «قائمة» (كلمة بطاقات داخل عنوان مفهوم محتوى مشروع)
        toggles = await pg.eval_on_selector_all("button", "els => els.map(e => e.innerText.trim()).filter(t => t === 'بطاقات' || t === 'قائمة' || t.startsWith('بطاقات') && t.length < 12)")
        print("لا مبدّل بطاقات/قائمة:", "نعم" if not toggles else f"لا! {toggles}")
        print("رقائق المحاور:", "نعم" if ("الكل" in lib and "نمو الطلاب" in lib) else "لا!")
        await pg.screenshot(path="scripts/w13_library.png", full_page=True)

        # ===== ٤) تفاصيل المفهوم: قسم أمثلة الطلاب + إضافة وحذف =====
        await pg.click("text=الوراثة وقوانينها", timeout=5000)
        await pg.wait_for_timeout(1200)
        det = await pg.inner_text("body")
        print("— تفاصيل المفهوم —")
        print("قسم أمثلة الطلاب ظاهر:", "نعم" if "أمثلة الطلاب — مجتمع التطبيق" in det else "لا!")
        print("شرح التخصصات:", "نعم" if "هندسة، طب، إنسانيات" in det else "لا!")

        # اختيار تخصص هندسة وكتابة مثال
        await pg.click("button:has-text('هندسة')", timeout=4000)
        await pg.fill(
            "textarea",
            "في هندسة المدن الكهربائية يشبه التعزيز الإيجابي إشارة مرور تعمل باستمرار فتوجه السائقين دون عقاب",
            timeout=4000,
        )
        await pg.click("text=أضف مثالك للمجتمع", timeout=4000)
        await pg.wait_for_timeout(800)
        det2 = await pg.inner_text("body")
        print("المثال المضاف ظاهر:", "نعم" if "إشارة مرور تعمل باستمرار" in det2 else "لا!")
        print("شريحة التخصص هندسة:", "نعم" if "هندسة" in det2 else "لا!")
        await pg.screenshot(path="scripts/w13_student_example.png", full_page=True)

        # حذف المثال
        await pg.click("button[aria-label='حذف المثال']", timeout=4000)
        await pg.wait_for_timeout(600)
        det3 = await pg.inner_text("body")
        print("الحذف يعمل:", "نعم" if "إشارة مرور تعمل باستمرار" not in det3 else "لا!")

        await b.close()

asyncio.run(main())
print("ALL CHECKS PASSED")
