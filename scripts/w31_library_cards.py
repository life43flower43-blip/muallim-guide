# -*- coding: utf-8 -*-
# تحقق إعادة تنظيم المكتبة (نموذج بطاقات المستخدم):
# ١) حذف عبارة «مكتبة المفاهيم» ٢) حذف التبويبات الأفقية (الكل/المحاور) ٣) تنقل بطاقي ثلاثي:
#    بطاقات محاور ← بطاقات موضوعات ← بطاقات مفاهيم ← تفاصيل المفهوم ٤) البحث والعودة ٥) تنظيف بادئات «أ.»
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

        # ===== المستوى الأول: بطاقات المحاور =====
        await pg.click("nav button[aria-label='المكتبة']", timeout=5000)
        await pg.wait_for_timeout(1000)
        lib = await pg.inner_text("body")
        print("— المستوى الأول: بطاقات المحاور —")
        print("حذف عبارة مكتبة المفاهيم:", "نعم" if "مكتبة المفاهيم" not in lib else "لا — موجودة!")
        print("حذف التبويب «الكل»:", "نعم" if "الكل" not in lib else "لا — موجود!")
        chips_gone = "كيف يتعلمون" not in lib and "ثقافة تربوية" in lib
        print("حذف شريط المحاور الأفقي:", "نعم" if "كيف يتعلمون" not in lib else "لا — موجود!")
        for name in ["نمو الطلاب", "المشاعر والذكاء", "كيف يتعلمون", "التقويم", "التدريس", "ثقافة تربوية"]:
            print(f"  بطاقة «{name}»:", "نعم" if name in lib else "لا!")
        print("حقل البحث باقٍ:", "نعم" if "ابحث عن مفهوم" in lib else "لا!")
        await pg.screenshot(path="scripts/w31_level1.png", full_page=True)

        # ===== المستوى الثاني: موضوعات «نمو الطلاب» =====
        await pg.click("text=نمو الطلاب", timeout=5000)
        await pg.wait_for_timeout(1000)
        lv2 = await pg.inner_text("body")
        print("— المستوى الثاني: موضوعات نمو الطلاب —")
        for t in ["الوراثة والسلوك", "الجهاز العصبي والسلوك", "الغدد الصماء والسلوك", "السلوك وتدرجاته"]:
            print(f"  بطاقة «{t}»:", "نعم" if t in lv2 else "لا!")
        print("زر العودة موجود:", "نعم" if await pg.query_selector("button[aria-label='عودة']") else "لا!")
        await pg.screenshot(path="scripts/w31_level2.png", full_page=True)

        # ===== المستوى الثالث: مفاهيم «الوراثة والسلوك» =====
        await pg.click("text=الوراثة والسلوك", timeout=5000)
        await pg.wait_for_timeout(1000)
        lv3 = await pg.inner_text("body")
        print("— المستوى الثالث: مفاهيم الوراثة والسلوك —")
        print("بطاقة «الوراثة وقوانينها»:", "نعم" if "الوراثة وقوانينها" in lv3 else "لا!")
        print("شارة «جديد»/«تمت القراءة»:", "نعم" if ("جديد" in lv3 or "تمت القراءة" in lv3) else "لا!")
        print("بلا حالة جامعية «الأسس البيولوجية»:", "نعم" if "الأسس البيولوجية" not in lv3 else "لا — موجودة!")
        await pg.screenshot(path="scripts/w31_level3.png", full_page=True)

        # ===== تفاصيل المفهوم من داخل الموضوع =====
        await pg.click("text=الوراثة وقوانينها", timeout=5000)
        await pg.wait_for_timeout(1300)
        det = await pg.inner_text("body")
        print("— تفاصيل المفهوم —")
        print("الشرح ظاهر:", "نعم" if "الشرح" in det else "لا!")
        print("أمثلة الميدان ظاهرة:", "نعم" if "أمثلة واقعية من الميدان" in det else "لا!")
        print("مجتمع الطلاب ظاهر:", "نعم" if "أمثلة الطلاب" in det else "لا!")
        print("الترويسة بالموضوع لا بالمحور الكتابي:", "نعم" if "الأسس البيولوجية" not in det else "لا!")
        await pg.screenshot(path="scripts/w31_detail.png", full_page=True)
        await pg.click("button[aria-label='إغلاق']", timeout=5000)
        await pg.wait_for_timeout(800)

        # ===== العودة خطوة خطوة =====
        await pg.click("button[aria-label='عودة']", timeout=5000)
        await pg.wait_for_timeout(700)
        back2 = await pg.inner_text("body")
        print("عودة إلى موضوعات المحور:", "نعم" if "الجهاز العصبي والسلوك" in back2 else "لا!")
        await pg.click("button[aria-label='عودة']", timeout=5000)
        await pg.wait_for_timeout(700)
        back1 = await pg.inner_text("body")
        print("عودة إلى بطاقات المحاور:", "نعم" if "ثقافة تربوية" in back1 and "الوراثة والسلوك" not in back1 else "لا!")

        # ===== الثقافة التربوية: تنظيف بادئات حروف الفهرس =====
        await pg.click("text=ثقافة تربوية", timeout=5000)
        await pg.wait_for_timeout(1000)
        g1 = await pg.inner_text("body")
        print("— الثقافة التربوية —")
        print("موضوع بلا بادئة «أجهزة تعليمية»:", "نعم" if "أجهزة تعليمية" in g1 else "لا!")
        print("لا بادئات فهرس «أ. »:", "نعم" if "أ. " not in g1 else "لا — موجودة!")
        await pg.screenshot(path="scripts/w31_g1.png", full_page=True)
        await pg.click("button[aria-label='عودة']", timeout=5000)
        await pg.wait_for_timeout(700)

        # ===== البحث الفوري من المستوى الأول =====
        await pg.fill("input[placeholder='ابحث عن مفهوم...']", "وراثة", timeout=5000)
        await pg.wait_for_timeout(900)
        sr = await pg.inner_text("body")
        print("— البحث —")
        print("نتائج البحث ظهرت:", "نعم" if "نتائج البحث" in sr and "الوراثة وقوانينها" in sr else "لا!")
        await pg.screenshot(path="scripts/w31_search.png", full_page=True)

        await b.close()
        print("تم — w31")

asyncio.run(main())
