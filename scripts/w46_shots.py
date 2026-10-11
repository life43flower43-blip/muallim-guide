# لقطة موسعة للرئيسية: بطاقة الاستوديو ورحلة المحاور بعد التمرير
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
            await pg.wait_for_timeout(1200)
        await pg.evaluate("document.querySelector('main').scrollTo(0, 900)")
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f"{SHOTS}/w46_home_scrolled.png")
        await pg.evaluate("document.querySelector('main').scrollTo(0, 99999)")
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f"{SHOTS}/w46_home_bottom.png")
        await b.close()
        print("SHOTS-OK")

asyncio.run(main())
