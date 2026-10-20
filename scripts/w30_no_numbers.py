# -*- coding: utf-8 -*-
# تحقق مهمة ٣٠: الترويسة الجديدة بلا حواف + حذف الكلام الفارغ + إتمام حذف الأرقام من كل الشاشات
import asyncio
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

        # ===== ١) الرئيسية: الترويسة الجديدة + حذف الكلام الفارغ =====
        home = await pg.inner_text("body")
        print("— الرئيسية —")
        print("حذف «صباح المعرفة»/«مساء الخير»:", "نعم" if ("صباح المعرفة" not in home and "مساء الخير" not in home and "نهار موفق" not in home) else "لا — موجود!")
        print("حذف «طالب التربية»:", "نعم" if "طالب التربية" not in home else "لا — موجود!")
        print("حذف «رحلتك الآن»:", "نعم" if "رحلتك الآن" not in home else "لا — موجود!")
        print("حذف التذييل الفارغ:", "نعم" if "من طالب تربية إلى معلم جاهز" not in home else "لا — موجود!")
        print("شريط «تربوي» ظاهر:", "نعم" if "تربوي" in home and "مساعد إعداد المعلم" in home else "لا!")
        print("اسم الطالب في الشريط:", "نعم" if "سلمى" in home else "لا!")
        print("بطاقة الاختبار المكثف باقية:", "نعم" if "اختبار مكثف يشمل جميع الأسئلة" in home else "لا!")
        print("مفهوم اليوم باق:", "نعم" if "مفهوم اليوم" in home else "لا!")
        # الترويسة ممتدة: نتحقق أن عنصر header بعرض كامل (لا حواف)
        hdr_w = await pg.eval_on_selector("header", "el => el.getBoundingClientRect().width")
        print("عرض الترويسة = عرض الشاشة (بلا حواف):", "نعم" if abs(hdr_w - 390) < 1 else f"لا! {hdr_w}")
        await pg.screenshot(path="scripts/w30_home.png", full_page=True)

        # ===== ٢) جلسة اختبار: بلا عدادات أرقام =====
        await pg.click("text=ابدأ الآن", timeout=5000)
        await pg.wait_for_timeout(1500)
        sess = await pg.inner_text("body")
        import re
        has_counter = re.search(r"\d+\s*من\s*\d+", sess)
        print("— جلسة الاختبار —")
        print("بلا عداد «س من ص»:", "نعم" if not has_counter else f"لا! {has_counter.group(0)}")
        print("شريط التقدم البصري باق:", "نعم" if await pg.query_selector(".progress-track") else "لا!")
        await pg.screenshot(path="scripts/w30_session.png", full_page=True)
        # أجب ثم أكمل للنتيجة
        await pg.click(".opt-btn >> nth=0", timeout=5000)
        await pg.wait_for_timeout(400)
        await pg.click("button:has-text('تحقق')", timeout=5000)
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path="scripts/w30_feedback.png", full_page=True)

        # ===== ٣) حسابي: بلا إحصاءات =====
        await pg.click("button[aria-label='خروج']", timeout=5000)
        await pg.wait_for_timeout(500)
        await pg.click("button:has-text('خروج')", timeout=5000)
        await pg.wait_for_timeout(800)
        await pg.click("nav button[aria-label='حسابي']", timeout=5000)
        await pg.wait_for_timeout(1000)
        acc = await pg.inner_text("body")
        print("— حسابي —")
        print("حذف «الدقة العامة»:", "نعم" if "الدقة العامة" not in acc else "لا — موجودة!")
        print("حذف «الدقة حسب المحور»:", "نعم" if "الدقة حسب المحور" not in acc else "لا — موجودة!")
        print("حذف «الدقة حسب الصعوبة»:", "نعم" if "الدقة حسب الصعوبة" not in acc else "لا — موجودة!")
        print("بلا نسب مئوية:", "نعم" if "٪" not in acc else "لا — توجد نسب!")
        print("حذف «طالب تربية — رحلة الإعداد المهني»:", "نعم" if "طالب تربية — رحلة الإعداد المهني" not in acc else "لا — موجودة!")
        print("محطات التقدم باقية:", "نعم" if "محطات التقدم" in acc else "لا!")
        await pg.screenshot(path="scripts/w30_account.png", full_page=True)

        # ===== ٤) أخطائي + الاختبارات: بلا أرقام =====
        await pg.click("nav button[aria-label='أخطائي']", timeout=5000)
        await pg.wait_for_timeout(1000)
        mk = await pg.inner_text("body")
        print("— أخطائي —", flush=True)
        print("بلا «١٠ أسئلة»:", "نعم" if "١٠ أسئلة" not in mk else "لا — موجود!", flush=True)
        print("بلا عداد مراجعات رقمي:", "نعم" if "مراجعات مستحقة الآن" in mk or "لا مراجعات مستحقة" in mk else "لا!", flush=True)
        await pg.screenshot(path="scripts/w30_mistakes.png", full_page=True)

        # مركز الاختبارات عبر عالم «أُدرّس» من الرئيسية
        await pg.click("nav button[aria-label='الرئيسية']", timeout=5000)
        await pg.wait_for_timeout(800)
        await pg.click("text=أُدرّس", timeout=5000)
        await pg.wait_for_timeout(1000)
        qh = await pg.inner_text("body")
        print("— مركز الاختبارات —", flush=True)
        print("بلا «١٠ أسئلة»:", "نعم" if "١٠ أسئلة" not in qh else "لا — موجود!", flush=True)
        print("بلا «٢٠ سؤالًا في ١٥ دقيقة»:", "نعم" if "٢٠ سؤالًا" not in qh else "لا — موجود!", flush=True)
        await pg.screenshot(path="scripts/w30_quizhome.png", full_page=True)

        await b.close()
        print("تم — w30")

asyncio.run(main())
