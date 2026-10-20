# تحقق حزمة التطوير ٣٤: حجم الخط + مؤشر عدم الاتصال + نطق السؤال + الاهتزاز + زر التثبيت + لا انحدار
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 844})
        pg = await ctx.new_page()
        await pg.goto(BASE, wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        if "ما اسمك" in await pg.inner_text("body"):
            await pg.fill("input", "سارة")
            await pg.click('button:has-text("لنبدأ الرحلة")')
            await pg.wait_for_timeout(1500)

        # ---- لا انحدار في الرئيسية ----
        body = await pg.inner_text("body")
        for t in ["ابدأ الاختبار", "عدد لا متناهي من الأسئلة", "الأساس", "أعرف", "أُدرّس", "تربوي"]:
            assert t in body, f"مفقود بالرئيسية: {t}"
        for bad in ["مفهوم اليوم", "رحلتك إلى الاحتراف", "ابدأ جلسة اليوم"]:
            assert bad not in body, f"نص محذوف عاد: {bad}"
        print("HOME regression: OK")

        # ---- حسابي: حجم الخط ----
        await pg.click('nav button[aria-label="حسابي"]')
        await pg.wait_for_timeout(900)
        body = await pg.inner_text("body")
        assert "حجم الخط" in body, "مفقود: حجم الخط"
        assert "عادي" in body and "كبير" in body and "أكبر" in body
        fs0 = await pg.evaluate("document.documentElement.style.fontSize")
        await pg.click('button:has-text("كبير")')
        await pg.wait_for_timeout(400)
        fs1 = await pg.evaluate("document.documentElement.style.fontSize")
        await pg.click('button:has-text("أكبر")')
        await pg.wait_for_timeout(400)
        fs2 = await pg.evaluate("document.documentElement.style.fontSize")
        await pg.screenshot(path=f"{SHOTS}/w34_account_font.png", full_page=True)
        await pg.click('button:has-text("عادي")')
        await pg.wait_for_timeout(400)
        fs3 = await pg.evaluate("document.documentElement.style.fontSize")
        print("FONT-SIZE:", repr(fs0), "->", repr(fs1), "->", repr(fs2), "->", repr(fs3))
        assert fs1 == "17.5px" and fs2 == "19px", "أحجام الخط غير مطبقة"

        # ---- الوضع الليلي: لا انحدار ----
        await pg.click('button:has-text("الوضع الليلي")')
        await pg.wait_for_timeout(400)
        dk = await pg.evaluate("document.documentElement.classList.contains('dark')")
        await pg.click('button:has-text("الوضع الليلي")')
        await pg.wait_for_timeout(300)
        print("DARK toggle regression:", dk)
        assert dk is True

        # ---- زر التثبيت: مخفي بأمان حين لا يمنح المتصفح الحدث ----
        btn_install = await pg.locator('button:has-text("أضف التطبيق إلى شاشتك الرئيسية")').count()
        print("INSTALL button count (0 أو 1 كلاهما مقبول):", btn_install)

        # ---- مؤشر عدم الاتصال ----
        await ctx.set_offline(True)
        await pg.wait_for_timeout(900)
        body = await pg.inner_text("body")
        off = "أنت الآن دون اتصال — التطبيق يواصل العمل كالمعتاد" in body
        await pg.screenshot(path=f"{SHOTS}/w34_offline.png")
        await ctx.set_offline(False)
        await pg.wait_for_timeout(900)
        body = await pg.inner_text("body")
        gone = "أنت الآن دون اتصال" not in body
        print("OFFLINE banner:", off, "| disappears:", gone)
        assert off and gone

        # ---- جلسة: نطق السؤال + الاهتزاز بلا انهيار ----
        await pg.click('nav button[aria-label="الرئيسية"]')
        await pg.wait_for_timeout(900)
        await pg.click('button[aria-label="ابدأ الاختبار"]')
        await pg.wait_for_timeout(1800)
        body = await pg.inner_text("body")
        assert "استمع إلى السؤال" in await pg.content(), "زر استماع السؤال مفقود"
        await pg.screenshot(path=f"{SHOTS}/w34_session_speak.png")
        # اختيار إجابة وتأكيدها — لا انهيار (الاهتزاز لا يُختبر لمسيًا هنا)
        # نضغط أول زر خيار: زر بدء بحرف الخيار (أ/ب/ج/د) أو زر صح/خطأ
        clicked = await pg.evaluate(
            """() => {
              const btns = [...document.querySelectorAll('button')];
              const opt = btns.find(b => /^[أ-د]/.test(b.innerText.trim()) || b.innerText.includes('خطأ'));
              if (opt) { opt.click(); return opt.innerText.slice(0, 20); }
              return null;
            }"""
        )
        print("PICKED:", clicked)
        assert clicked, "لا يوجد زر خيار"
        await pg.wait_for_timeout(300)
        gbtn = await pg.evaluate(
            """() => {
              const b = [...document.querySelectorAll('button')].find(x =>
                x.innerText.includes('تأكيد الاختيار') || x.innerText.trim() === 'تحقق');
              if (b) { b.click(); return b.innerText.trim(); }
              return null;
            }"""
        )
        print("GRADE-BTN:", gbtn)
        assert gbtn, "زر التحقق غير موجود"
        await pg.wait_for_timeout(700)
        body = await pg.inner_text("body")
        graded = ("أحسنت! إجابة صحيحة" in body) or ("إجابة غير صحيحة" in body)
        print("SESSION speak-btn + grade:", graded)
        assert graded

        await b.close()
        print("ALL-OK")

asyncio.run(main())
