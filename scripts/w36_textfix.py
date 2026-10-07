# تحقق إصلاحات النصوص + سلامة المكتبة بعد إصلاح الأرقام واللاتيني
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        await pg.goto(BASE, wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        if "ما اسمك" in await pg.inner_text("body"):
            await pg.fill("input", "سارة")
            await pg.click('button:has-text("لنبدأ الرحلة")')
            await pg.wait_for_timeout(1500)

        # المكتبة → بحث عن مفاهيم أُصلحت عناوينها
        await pg.click('nav button[aria-label="المكتبة"]')
        await pg.wait_for_timeout(1000)
        for term in ["الواقع الافتراضي", "منصات إدارة التعلم"]:
            await pg.fill('input[placeholder="ابحث عن مفهوم..."]', term)
            await pg.wait_for_timeout(900)
            body = await pg.inner_text("body")
            assert term in body, f"لم يظهر: {term}"
            import re
            has_latin = bool(re.search(r"[A-Za-z]", body))
            print(f"SEARCH '{term}': موجود | لاتيني بالصفحة: {has_latin}")
        await pg.fill('input[placeholder="ابحث عن مفهوم..."]', "")
        await pg.wait_for_timeout(500)

        # محاور M4 تظل كما هي + لا انحدار عام
        await pg.click('nav button[aria-label="الرئيسية"]')
        await pg.wait_for_timeout(800)
        body = await pg.inner_text("body")
        assert "ابدأ الاختبار" in body
        await pg.screenshot(path=f"{SHOTS}/w36_after_textfix.png")
        print("HOME regression: OK")
        await b.close()
        print("ALL-OK")

asyncio.run(main())
