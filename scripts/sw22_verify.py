# -*- coding: utf-8 -*-
"""محاكاة جهاز المستخدم: زيارتان مع عامل خدمة نشط للتحقق أن التحديث يصل تلقائيًا."""
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # سياق ثابت يحاكي متصفحًا حقيقيًا يحفظ عامل الخدمة بين الزيارات
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()

        # زيارة ١: تحميل + تسجيل عامل الخدمة
        await page.goto(BASE, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2500)
        sw_state = await page.evaluate(
            "navigator.serviceWorker.controller ? 'مسيطر' : 'غير مسيطر'"
        )
        print("زيارة ١ — عامل الخدمة:", sw_state)

        # زيارة ٢: إعادة تحميل — يجب أن يبقى المحتوى جديدًا
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2000)
        body = await page.inner_text("body")
        print("زيارة ٢ — حروف:", len(body), "| عامل الخدمة:",
              await page.evaluate("navigator.serviceWorker.controller ? 'مسيطر' : 'غير مسيطر'"))

        # نسخة الكاش الحالية
        ver = await page.evaluate(
            "caches.keys().then(k => k.join(','))"
        )
        print("كاش المتصفح:", ver)

        # الانتقال لدليل المعلم ← نمو الطالب
        for txt in ("سارة", "لنبدأ الرحلة"):
            try:
                el = page.get_by_text(txt).first
                if await el.is_visible(timeout=1200):
                    await el.click()
                    await page.wait_for_timeout(500)
                    break
            except Exception:
                pass
        tab = page.get_by_text("دليل المعلم", exact=True).first
        if await tab.is_visible(timeout=3000):
            await tab.click()
            await page.wait_for_timeout(1500)
        m1 = page.get_by_text("نمو الطالب", exact=False).first
        if not await m1.is_visible(timeout=2000):
            m1 = page.get_by_text("نمو الطلاب", exact=False).first
        if await m1.is_visible(timeout=3000):
            await m1.click()
            await page.wait_for_timeout(1500)
        body2 = await page.inner_text("body")
        keywords = ["مدخل إلى علم النمو", "مناهج دراسة النمو", "النظريات الكبرى",
                    "المراهقة", "النمو اللغوي", "الفروق الفردية"]
        found = [k for k in keywords if k in body2]
        print("فصول جديدة ظاهرة على الإنتاجي:", found)
        await page.screenshot(path="scripts/sw22_m1_prod.png")
        await ctx.close()
        await browser.close()

asyncio.run(main())
print("تم")
