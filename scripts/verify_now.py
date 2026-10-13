# -*- coding: utf-8 -*-
"""فحص سريع للتأكد أن التوسعة وإعادة التصميم ظاهرة في التطبيق."""
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        try:
            await page.goto(BASE, wait_until="networkidle", timeout=45000)
            await page.wait_for_timeout(1200)
            # تخطي onboarding إن ظهر
            for txt in ("سارة", "لنبدأ الرحلة", "ابدأ"):
                try:
                    el = page.get_by_text(txt).first
                    if await el.is_visible(timeout=1500):
                        await el.click()
                        await page.wait_for_timeout(500)
                        break
                except Exception:
                    pass
            await page.screenshot(path="scripts/verify_0_home.png")

            # الانتقال إلى المكتبة
            lib = page.get_by_text("المكتبة", exact=True).first
            if await lib.is_visible(timeout=3000):
                await lib.click()
                await page.wait_for_timeout(1000)
            await page.screenshot(path="scripts/verify_1_library.png")

            # فتح محور نمو الطلاب M1
            m1 = page.get_by_text("نمو الطلاب", exact=False).first
            if await m1.is_visible(timeout=3000):
                await m1.click()
                await page.wait_for_timeout(1200)
            await page.screenshot(path="scripts/verify_2_m1.png", full_page=False)

            # عدّ الموضوعات الظاهرة
            body = await page.inner_text("body")
            print("حروف صفحة M1:", len(body))
            keywords = ["علم النمو", "النظريات", "المراهقة", "النمو اللغوي", "النمو الأخلاقي", "الفروق الفردية"]
            found = [k for k in keywords if k in body]
            print("فصول جديدة ظاهرة:", found)
            await page.screenshot(path="scripts/verify_3_m1_full.png", full_page=True)
        finally:
            await browser.close()

asyncio.run(main())
print("تم")
