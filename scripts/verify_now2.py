# -*- coding: utf-8 -*-
"""فحص سريع v2: فتح دليل المعلم ← محور نمو الطلاب ← التحقق من الفصول الجديدة."""
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        try:
            await page.goto(BASE, wait_until="networkidle", timeout=45000)
            await page.wait_for_timeout(1500)
            # تخطي onboarding إن ظهر
            for txt in ("سارة", "لنبدأ الرحلة", "ابدأ الرحلة"):
                try:
                    el = page.get_by_text(txt).first
                    if await el.is_visible(timeout=1200):
                        await el.click()
                        await page.wait_for_timeout(600)
                        break
                except Exception:
                    pass

            # فتح تبويب دليل المعلم من الشريط السفلي
            tab = page.get_by_text("دليل المعلم", exact=True).first
            if await tab.is_visible(timeout=3000):
                await tab.click()
                await page.wait_for_timeout(1500)
            await page.screenshot(path="scripts/verify_lib2.png")

            # البحث عن بطاقة نمو الطلاب/نمو الطالب
            m1 = page.get_by_text("نمو الطالب", exact=False).first
            if not await m1.is_visible(timeout=2000):
                m1 = page.get_by_text("نمو الطلاب", exact=False).first
            if await m1.is_visible(timeout=3000):
                await m1.click()
                await page.wait_for_timeout(1500)
            await page.screenshot(path="scripts/verify_m1_top2.png")

            body = await page.inner_text("body")
            print("حروف صفحة M1:", len(body))
            keywords = ["مدخل إلى علم النمو", "مناهج دراسة النمو", "النظريات الكبرى",
                        "المراهقة", "النمو اللغوي", "النمو الأخلاقي", "الفروق الفردية",
                        "تطبيقات النمو في الصف"]
            found = [k for k in keywords if k in body]
            print("فصول جديدة ظاهرة:", found)
            await page.screenshot(path="scripts/verify_m1_full2.png", full_page=True)
        finally:
            await browser.close()

asyncio.run(main())
print("تم")
