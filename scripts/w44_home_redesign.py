# فحص الرئيسية الجديدة: الهيرو والتحية والحلقة والسلسلة + المختبر + الرحلة + الوضع الليلي + النظافة
import asyncio
import json
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        await pg.goto(BASE, wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1800)
        if "ما اسمك" in await pg.inner_text("body"):
            await pg.fill("input", "سارة")
            await pg.click('button:has-text("لنبدأ الرحلة")')
            await pg.wait_for_timeout(1400)

        # الهيرو: التحية بالاسم + مؤشرا الحالة
        body = await pg.inner_text("body")
        assert "سارة" in body, "الاسم غائب عن التحية"
        assert ("صباح الخير" in body) or ("مساء الخير" in body) or ("طاب نهارك" in body), "التحية الزمنية غائبة"
        assert "هدف اليوم" in body, "حلقة هدف اليوم غائبة"
        assert "سلسلة المواصلة" in body, "شارة السلسلة غائبة"
        assert "مساعد إعداد المعلم" in body, "هوية التطبيق غائبة"
        print("HERO: التحية بالاسم + هدف اليوم + السلسلة ✓")

        # بطاقة الاختبار الجوهرية
        assert "ابدأ الاختبار" in body, "بطاقة الاختبار غائبة"
        assert "أسئلة لا تنتهي من كل المكتبة" in body, "وصف الاختبار غائب"
        print("CTA: بطاقة الاختبار الدائرية ✓")

        # المختبر بشارته
        assert "مختبر المعلّم" in body and "جديد" in body, "بطاقة المختبر غائبة"
        assert "مواقف متفرعة" in body and "خريطة كفاءات" in body and "مرآة المعلّم" in body, "رقائق المختبر ناقصة"
        print("LAB-CARD: بطاقة المختبر برقائقها الثلاث ✓")

        # الرحلة: عنوانها ومرحلتها وخطوتها
        assert "رحلتك إلى الاحتراف" in body, "عنوان الرحلة غائب"
        assert "المرحلة الأولى" in body, "كلمة المرحلة النوعية غائبة"
        assert "خطوتك الآن" in body, "سطر الخطوة التالية غائب"
        for w in ["الأساس", "أعرف", "أُدرّس", "أواجه", "أتدرّب", "أصبح معلّمًا"]:
            assert w in body, f"محور {w} غائب"
        print("JOURNEY: المحاور الستة بالمرحلة والخطوة ✓")
        await pg.screenshot(path=f"{SHOTS}/w44_home_light_top.png")
        await pg.evaluate("() => document.querySelector('main').scrollTo(0, 999999)")
        await pg.wait_for_timeout(600)
        await pg.screenshot(path=f"{SHOTS}/w44_home_light_bottom.png")

        # نظافة نصية: صفر أرقام وصفر لاتيني
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", body)
        assert not leak, f"تسريب نصي بالرئيسية: {leak[:6]}"
        print("TEXT-CLEAN: صفر أرقام وصفر لاتيني في الرئيسية ✓")

        # فتح المختبر من البطاقة
        await pg.evaluate("() => document.querySelector('main').scrollTo(0, 0)")
        await pg.wait_for_timeout(300)
        await pg.click('button:has-text("مختبر المعلّم")')
        await pg.wait_for_timeout(900)
        body = await pg.inner_text("body")
        assert "مواقف سريعة" in body, "المختبر لم يفتح"
        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(600)
        print("LAB-OPEN: المختبر يفتح من البطاقة ويغلق ✓")

        # الاختبار يبدأ من الزر الدائري
        await pg.click('button[aria-label="ابدأ الاختبار"]')
        await pg.wait_for_timeout(1200)
        body = await pg.inner_text("body")
        assert "الاختبار المكثف" in body, "جلسة الاختبار لم تبدأ"
        await pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('turbawy-app-v1')); s.state.quizConfig = null; s.state.scenariosOpen = false; localStorage.setItem('turbawy-app-v1', JSON.stringify(s)); }")
        await pg.reload(wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        print("QUIZ-START: الزر الدائري يبدأ الاختبار المكثف ✓")

        # الوضع الليلي عبر مخزن التفضيلات ثم إعادة تحميل
        await pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('turbawy-app-v1')); s.state.darkMode = 'dark'; localStorage.setItem('turbawy-app-v1', JSON.stringify(s)); }")
        await pg.reload(wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        body = await pg.inner_text("body")
        assert "هدف اليوم" in body, "الرئيسية لم تظهر بالوضع الليلي"
        await pg.screenshot(path=f"{SHOTS}/w44_home_dark_top.png")
        await pg.evaluate("() => document.querySelector('main').scrollTo(0, 999999)")
        await pg.wait_for_timeout(600)
        await pg.screenshot(path=f"{SHOTS}/w44_home_dark_bottom.png")
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", body)
        assert not leak, f"تسريب نصي بالليلي: {leak[:6]}"
        print("DARK-MODE: الرئيسية تعمل ليليًا بنظافة كاملة ✓")

        # الثبات بعد إعادة تحميل أخيرة للوضع الفاتح
        await pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('turbawy-app-v1')); s.state.darkMode = 'light'; localStorage.setItem('turbawy-app-v1', JSON.stringify(s)); }")
        await pg.reload(wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1200)
        body = await pg.inner_text("body")
        assert "رحلتك إلى الاحتراف" in body, "الرئيسية لم تعد بعد التحميل"
        print("PERSIST: ثابتة بعد إعادة التحميل ✓")

        await b.close()
        print("ALL-OK")

asyncio.run(main())
