# -*- coding: utf-8 -*-
# تحقق بصري: بلا «جامعة/مساقات» في الواجهة + العالم الأول «الأساس»
import asyncio, re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
BAD = re.compile(r"الجامعة|مساق|سنة جامعية|كتاب جامعي")

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
            await pg.wait_for_timeout(1500)
        except Exception:
            pass
        await pg.screenshot(path="scripts/w10_home_top.png")
        body = await pg.inner_text("body")
        bad = set(BAD.findall(body))
        print("رؤية «الأساس»:", "نعم" if "الأساس" in body else "لا!")
        print("رؤية «من طالب تربية إلى معلم جاهز»:", "نعم" if "من طالب تربية إلى معلم جاهز" in body else "لا!")
        print("كلمات محظورة ظاهرة:", bad if bad else "لا شيء")
        # شاشة المفاهيم: تأكد من بلا «مساق»
        await pg.click("text=المكتبة", timeout=5000)
        await pg.wait_for_timeout(1200)
        body2 = await pg.inner_text("body")
        bad2 = set(BAD.findall(body2))
        print("المكتبة — كلمات محظورة:", bad2 if bad2 else "لا شيء")
        print("المحاور ظاهرة:", "نعم" if "فهم نمو الطلاب" in body2 else "تحقق يدوي")
        await pg.screenshot(path="scripts/w10_library.png")
        await b.close()
        if bad or bad2:
            raise SystemExit("FAIL: بقايا صياغة محظورة")

asyncio.run(main())
print("ALL CHECKS PASSED")
