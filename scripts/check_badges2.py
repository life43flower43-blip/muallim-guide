# -*- coding: utf-8 -*-
"""قراءة نص صفحة دليل المعلم للتحقق من العدادات."""
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900}, locale="ar")
        page = await ctx.new_page()
        await page.goto(BASE, wait_until="networkidle")
        await page.wait_for_timeout(1500)
        tab = page.get_by_text("دليل المعلم", exact=True).last
        await tab.click()
        await page.wait_for_timeout(1800)
        body = await page.inner_text("body")
        # اطبع الأسطر التي تحوي «مفهومًا» مع سياقها
        lines = [l.strip() for l in body.split("\n") if l.strip()]
        for i, l in enumerate(lines):
            if "مفهوم" in l:
                ctx_line = " | ".join(lines[max(0, i - 2): i + 1])
                print("«", ctx_line[:120])
        await browser.close()


asyncio.run(main())
