# لقطات الوضع الليلي: الرئيسية + السجل الميداني + ملف الإنجاز
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 844})
        pg = await ctx.new_page()
        await pg.goto(BASE, wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        if "ما اسمك" in await pg.inner_text("body"):
            await pg.fill("input", "سارة")
            await pg.click('button:has-text("لنبدأ الرحلة")')
            await pg.wait_for_timeout(1200)

        # تفعيل الوضع الليلي من حسابي
        await pg.click('button[aria-label="حسابي"]')
        await pg.wait_for_timeout(800)
        await pg.click('button:has-text("ليلي")')
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=f"{SHOTS}/w47_dark_portfolio.png")

        # الرئيسية ليلياً
        await pg.click('button[aria-label="الرئيسية"]')
        await pg.wait_for_timeout(800)
        await pg.screenshot(path=f"{SHOTS}/w47_dark_home.png")

        # السجل الميداني ليلياً — نموذج + قائمة
        await pg.click('button:has-text("سجل التدريب الميداني")')
        await pg.wait_for_selector('text=كيف يعمل السجل؟', timeout=5000)
        await pg.click('button:has-text("اقرأ موضوع الدرس في الكتاب قبل الحصة")')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=f"{SHOTS}/w47_dark_field_new.png")

        await b.close()
        await ctx.close()
        print("DONE")

asyncio.run(main())
