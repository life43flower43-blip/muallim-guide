# تشخيص: ماذا يعرض المتصفح فعلاً عند فتح الرئيسية؟
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        pg.on("console", lambda m: print("CONSOLE", m.type, m.text[:200]))
        pg.on("pageerror", lambda e: print("PAGEERROR", str(e)[:300]))
        await pg.goto("http://localhost:3000", wait_until="networkidle")
        await pg.wait_for_timeout(2500)
        txt = await pg.inner_text("body")
        print("BODY:", repr(txt[:600]))
        await pg.screenshot(path="/home/z/my-project/scripts/w32_debug.png", full_page=True)
        await b.close()

asyncio.run(main())
