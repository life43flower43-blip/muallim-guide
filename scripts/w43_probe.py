# مسبار: ماذا يظهر بعد نقر «مواقف سريعة» من داخل المختبر؟
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
            await pg.wait_for_timeout(1200)

        await pg.click('nav button[aria-label="تدريب"]')
        await pg.wait_for_timeout(900)
        await pg.click('button:has-text("المواقف")')
        await pg.wait_for_timeout(400)
        await pg.click('button:has-text("مواقف سريعة")')
        await pg.wait_for_timeout(1200)

        body = await pg.inner_text("body")
        print("LAB_TITLE_VISIBLE:", "مختبر المعلّم" in body)
        print("QUICK_VISIBLE:", "محاكاة الصف" in body or "مواقف سريعة" in body)
        print("---- أول 600 حرف من النص الظاهر ----")
        print(body[:600].replace("\n", " | "))
        await pg.screenshot(path="/home/z/my-project/scripts/w43_probe_quick.png")
        await b.close()

asyncio.run(main())
