# اختبار بصري: تعريب الأرقام + حظر المترجم + حذف الأرقام عديمة العلاقة
import asyncio, re, sys
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
PASS = FAIL = 0
def check(name, cond):
    global PASS, FAIL
    print(("PASS " if cond else "FAIL ") + name)
    PASS, FAIL = PASS + (1 if cond else 0), FAIL + (0 if cond else 1)

AR_DIGIT = re.compile(r"[٠-٩]")
LATIN = re.compile(r"[0-9]")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        await pg.goto(BASE, wait_until="networkidle")
        await pg.wait_for_timeout(2500)

        # بوابة الاسم عند أول زيارة: أدخل اسمًا وابدأ
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        try:
            await pg.fill("input", "سلمى", timeout=4000)
            await pg.click("text=لنبدأ الرحلة", timeout=3000)
            await pg.wait_for_timeout(1500)
        except Exception:
            pass

        # ١) حظر المترجم في <html>
        attrs = await pg.get_attribute("html", "translate")
        check("html[translate=no]", attrs == "no")

        # ٢) الشريط السفلي: التسميات الصحيحة بلا لاتيني
        nav = await pg.inner_text("nav[aria-label='التنقل الرئيسي']")
        check("الشريط: الرئيسية/المكتبة/تدريب/حسابي", all(w in nav for w in ["الرئيسية", "المكتبة", "تدريب", "حسابي"]))
        check("الشريط بلا أرقام لاتينية", not LATIN.search(nav))

        # ٣) الرئيسية: أرقام مشرقية فقط
        body_text = await pg.inner_text("body")
        # السماح بالأرقام اللاتينية داخل خصائص style فقط — نفحص النص المرئي
        check("الرئيسية: «هدف اليوم» بصيغة من", "هدف اليوم:" in body_text and "من" in body_text)
        check("الرئيسية: لا أرقام لاتينية في النص", not LATIN.search(body_text))
        check("الرئيسية: يوجد أرقام مشرقية", bool(AR_DIGIT.search(body_text)))
        check("الرئيسية: المستوى بالعربي", "المستوى ١" in body_text or "المستوى " in body_text)

        # ٤) رقائق الرحلة: أوصاف وظيفية لا عدادات، ولا دوائر مرقمة
        chips = await pg.inner_text("section:has-text('رحلتك إلى الاحتراف')")
        for w in ["مفاهيم موادك الجامعية", "مكتبة المفاهيم العامة", "محاكاة مواقف الصف", "مستواك وإنجازاتك"]:
            check(f"رقاقة: {w}", w in chips)
        check("رقائق: لا «مفهومًا» بعدادات", "مفهومًا" not in chips)
        check("رقائق: لا «المستوى ١» مكرر", "المستوى" not in chips)

        # ٥) بطاقة تقدمك: سطر سليم «X من Y مفهومًا»
        card = await pg.inner_text("div.card-soft:has-text('تقدمك في المكتبة')")
        check("تقدمك: صيغة من", "من" in card and "مفهوم" in card)
        check("تقدمك: لا لاتيني", not LATIN.search(card))

        await pg.screenshot(path="scripts/w9_home_top.png")
        await pg.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.75)")
        await pg.wait_for_timeout(600)
        await pg.screenshot(path="scripts/w9_home_journey.png")

        # ٦) المكتبة: مساق بأرقام مشرقية
        await pg.click("nav[aria-label='التنقل الرئيسي'] >> text=المكتبة", force=True)
        await pg.wait_for_timeout(1200)
        lib = await pg.inner_text("body")
        check("المكتبة: مساق ١", "مساق ١" in lib)
        check("المكتبة: بلا لاتيني", not LATIN.search(lib))
        await pg.screenshot(path="scripts/w9_library.png")

        # ٧) سيناريو: السؤال الصحيح «ماذا ستفعل؟» وعدّاد مشرقي
        await pg.click("nav[aria-label='التنقل الرئيسي'] >> text=تدريب", force=True)
        await pg.wait_for_timeout(1200)
        # إن كانت هناك شاشة اختيار بدء، اضغط ابدأ
        try:
            await pg.click("text=ابدأ جولة", timeout=3000)
        except Exception:
            pass
        await pg.wait_for_timeout(1200)
        sc = await pg.inner_text("body")
        check("سيناريو: ماذا ستفعل؟", "ماذا ستفعل؟" in sc)
        check("سيناريو: ١ من ١٠", "١ من" in sc)
        check("سيناريو: بلا لاتيني", not LATIN.search(sc))
        await pg.screenshot(path="scripts/w9_scenario.png")

        # ٨) حسابي
        await pg.click("nav[aria-label='التنقل الرئيسي'] >> text=حسابي", force=True)
        await pg.wait_for_timeout(1000)
        acc = await pg.inner_text("body")
        check("حسابي: بلا لاتيني", not LATIN.search(acc))
        check("حسابي: باقي نقطة للمستوى التالي", "للمستوى التالي" in acc)

        await b.close()

    print(f"\nالنتيجة: {PASS} ناجح / {FAIL} فاشل")
    sys.exit(1 if FAIL else 0)

asyncio.run(main())
