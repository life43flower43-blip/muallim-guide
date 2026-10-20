# فحص خفيف: ظهور الأقسام الثلاثة الجديدة في بحث المكتبة
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

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
        await pg.click('nav button[aria-label="المكتبة"]')
        await pg.wait_for_timeout(1000)
        for term in ["التنمر الإلكتروني", "الإبلاغ الإلزامي", "التناص"]:
            await pg.fill('input[placeholder="ابحث عن مفهوم..."]', term)
            await pg.wait_for_timeout(900)
            body = await pg.inner_text("body")
            print(f"SEARCH '{term}':", "موجود ✓" if term in body else "غائب ✗")
        await b.close()

asyncio.run(main())
