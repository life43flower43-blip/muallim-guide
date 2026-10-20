# -*- coding: utf-8 -*-
"""لقطات حالية للشاشات الداخلية — تنقل عبر aria-label."""
import asyncio
from playwright.async_api import async_playwright

BASE = 'http://localhost:3000'

async def hide_portal(page):
    await page.add_init_script("""
      const s=document.createElement('style');
      s.textContent='nextjs-portal{display:none!important}';
      document.addEventListener('DOMContentLoaded',()=>document.head.appendChild(s));
    """)

async def nav(page, label, shot, wait=900):
    btn = page.locator(f'nav[aria-label="التنقل الرئيسي"] button[aria-label="{label}"]')
    if await btn.count():
        await btn.first.click()
        await page.wait_for_timeout(wait)
    await page.screenshot(path=shot, full_page=False)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={'width': 414, 'height': 896}, locale='ar')
        page = await ctx.new_page()
        await hide_portal(page)
        try:
            await page.goto(BASE, wait_until='networkidle', timeout=30000)
        except Exception:
            await page.goto(BASE, timeout=30000)
        await page.wait_for_timeout(1500)
        if await page.get_by_text('لنبدأ الرحلة').count():
            await page.get_by_text('لنبدأ الرحلة').first.click()
            await page.wait_for_timeout(900)

        await nav(page, 'دليل المعلم', 'scripts/r_lib_courses.png')
        await page.mouse.wheel(0, 700)
        await page.wait_for_timeout(400)
        await page.screenshot(path='scripts/r_lib_courses2.png', full_page=False)

        # فتح محور نمو الطلاب
        m1 = page.get_by_text('فهم نمو الطلاب', exact=False).first
        if await m1.count():
            await m1.click()
            await page.wait_for_timeout(900)
        await page.screenshot(path='scripts/r_m1.png', full_page=False)
        await page.mouse.wheel(0, 500)
        await page.wait_for_timeout(400)
        await page.screenshot(path='scripts/r_m1_2.png', full_page=False)

        # رجوع ثم مفهوم
        await nav(page, 'دليل المعلم', 'scripts/r_lib_back.png')
        card = page.locator('[class*="card"], button, [role="button"]').filter(has_text='فهم نمو الطلاب').first
        if await card.count():
            await card.click(); await page.wait_for_timeout(800)
        try:
            ch = page.locator('button').filter(has_text='الوراثة والسلوك').first
            if await ch.count(): await ch.click(); await page.wait_for_timeout(700)
        except Exception: pass
        try:
            con = page.locator('button').filter(has_text='الوراثة وقوانينها').first
            if await con.count(): await con.click(); await page.wait_for_timeout(900)
        except Exception as e: print('c', e)
        await page.screenshot(path='scripts/r_concept.png', full_page=False)

        await nav(page, 'الاختبارات', 'scripts/r_quiz.png')
        await page.mouse.wheel(0, 600); await page.wait_for_timeout(400)
        await page.screenshot(path='scripts/r_quiz2.png', full_page=False)

        await nav(page, 'أخطائي', 'scripts/r_mistakes.png')
        await nav(page, 'حسابي', 'scripts/r_account.png')
        await page.mouse.wheel(0, 600); await page.wait_for_timeout(400)
        await page.screenshot(path='scripts/r_account2.png', full_page=False)

        await browser.close()
        print('done')

asyncio.run(main())
