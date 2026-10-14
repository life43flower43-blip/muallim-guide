# -*- coding: utf-8 -*-
"""قراءة شارات العدد على بطاقات المحاور مباشرة."""
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

CHAPTERS_TO_CHECK = ["واتسون والسلوكية المتطرفة", "المرونة العصبية وأساس التعلم"]


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900}, locale="ar")
        page = await ctx.new_page()
        # تخطي أي كاش: طلب شبكي خالص
        await page.goto(BASE + "/?nocache=1", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        # طباعة ما تحتويه الذاكرة من مفاهيم M3 عبر فحص نصوص الصفحة الرئيسية أولًا
        tabs = await page.query_selector_all("text=دليل المعلم")
        if tabs:
            await tabs[-1].click()
            await page.wait_for_timeout(1500)
        badges = await page.eval_on_selector_all(
            "span.rounded-full",
            "els => els.map(e => e.textContent)",
        )
        print("الشارات الظاهرة:", [b for b in badges if "مفهوم" in str(b)])
        await browser.close()


asyncio.run(main())
