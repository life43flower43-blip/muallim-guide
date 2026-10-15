# -*- coding: utf-8 -*-
# دخان وضع الجلسة الموسعة: بدء الجلسة → إنهاء موقف أول → ظهور زر الموقف التالي
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
OK = []

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 800})
        await page.goto(BASE, wait_until="networkidle")
        # بوابة الترحيب إن ظهرت
        for txt in ("سارة", "لنبدأ الرحلة", "ابدأ"):
            try:
                el = page.get_by_text(txt).first
                if await el.is_visible(timeout=1200):
                    await el.click()
                    await page.wait_for_timeout(600)
            except Exception:
                pass
        # فتح المختبر: عنوانه يجب أن يكون في الرئيسية كبطاقة (exact=True كما في السكربت المجرّب)
        await page.get_by_text("مختبر محاكاة الصفوف", exact=True).first.click()
        await page.wait_for_timeout(1200)

        # ١) زر الجلسة الموسعة ظاهر
        btn = page.get_by_text("جلسة موسعة").first
        OK.append(("زر الجلسة الموسعة ظاهر", await btn.is_visible(timeout=5000)))
        await btn.click()
        await page.wait_for_timeout(1000)

        # ٢) شريط تقدم الجلسة
        banner = page.get_by_text("الجلسة الموسعة — الموقف ١ من ٣").first
        OK.append(("شريط الجلسة (الموقف ١ من ٣) ظاهر", await banner.is_visible(timeout=5000)))

        # ٣) إتمام موقف أول: اختيار أول خيار دائماً ثم المتابعة حتى الختام
        steps = 0
        while steps < 30:
            opt = page.locator("button:has(span.rounded-xl)").first
            try:
                await opt.is_visible(timeout=4000)
            except Exception:
                break
            await opt.click()
            await page.wait_for_timeout(400)
            nxt = page.get_by_text("ماذا حدث بعد ذلك؟").first
            if await nxt.is_visible(timeout=3000):
                await nxt.click()
                await page.wait_for_timeout(500)
            steps += 1
            # هل وصلنا نهاية الموقف الأول؟
            if await page.get_by_text("الموقف التالي في الجلسة").first.is_visible(timeout=1200):
                break
        OK.append(("الوصول إلى زر «الموقف التالي في الجلسة»", steps < 30))
        nxt_btn = page.get_by_text("الموقف التالي في الجلسة").first
        vis = await nxt_btn.is_visible(timeout=2000)
        OK.append(("زر الموقف التالي يعمل", vis))
        if vis:
            await nxt_btn.click()
            await page.wait_for_timeout(1000)
            b2 = page.get_by_text("الجلسة الموسعة — الموقف ٢ من ٣").first
            OK.append(("الانتقال إلى الموقف ٢ من ٣", await b2.is_visible(timeout=5000)))

        # ٤) خروج نظيف من الجلسة
        ex = page.get_by_text("إنهاء الجلسة").first
        OK.append(("زر إنهاء الجلسة ظاهر", await ex.is_visible(timeout=3000)))
        if await ex.is_visible(timeout=1500):
            await ex.click()
            await page.wait_for_timeout(800)
            OK.append(("العودة إلى القائمة بعد الإنهاء", await page.get_by_text("مواقف الحصة الحقيقية").first.is_visible(timeout=4000)))

        # ٥) لاتيني ظاهر؟
        body = await page.inner_text("body")
        import re
        latin = [w for w in re.findall(r"[A-Za-z]{3,}", body)][:5]
        OK.append(("صفر لاتيني ظاهر", not latin))

        await browser.close()

    passed = sum(1 for _, v in OK if v)
    for name, v in OK:
        print(("✔" if v else "✗"), name)
    print(f"{passed}/{len(OK)}")

asyncio.run(main())
