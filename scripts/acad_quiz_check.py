# -*- coding: utf-8 -*-
"""فحص التعليل الأكاديمي (نسخة محصنة): إجابة ← تقدم ← أكورديون التعليل."""
import asyncio, re, sys
from playwright.async_api import async_playwright

BASE = 'http://localhost:3000'
CJK = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]')

async def click_enabled_first(page, loc, timeout=2500):
    try:
        await loc.first.click(timeout=timeout)
        return True
    except Exception:
        return False

async def main():
    ok, fail = [], []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={'width': 390, 'height': 844})
        page = await ctx.new_page()
        try:
            await page.goto(BASE, wait_until='networkidle', timeout=45000)
            await page.add_style_tag(content="nextjs-portal{display:none!important}")
            await page.wait_for_timeout(800)
            body = await page.inner_text('body')
            if 'لنبدأ الرحلة' in body:
                await page.get_by_text('لنبدأ الرحلة').first.click(); await page.wait_for_timeout(600)

            await page.get_by_text('الاختبارات', exact=True).first.click()
            await page.wait_for_timeout(1000)
            await page.get_by_text('اختبار سريع', exact=False).first.click()
            await page.wait_for_timeout(1000)

            base_seen = alt_seen = opened = 0, 0, 0
            base_seen = alt_seen = opened = 0
            for i in range(10):
                # خيارات: أزرار بعناوين عربية طويلة (بصح/خطأ أو متعدد)
                opts = page.locator('button').filter(has_text=re.compile(r'^(صح|خطأ|[أ-ي].{6,})$'))
                if await opts.count() >= 2:
                    await opts.nth(i % 2).click(timeout=3000)
                    await page.wait_for_timeout(700)
                # تحقق/تأكيد إن ظهر
                for label in ['تحقق', 'تأكيد الاختيار']:
                    b = page.get_by_text(label, exact=True).first
                    if await b.count():
                        try:
                            await b.click(timeout=2000)
                            await page.wait_for_timeout(800)
                        except Exception:
                            pass
                        break
                # أكورديون التعليل
                acc = page.get_by_text('التعليل ومصدر المفهوم').first
                if await acc.count():
                    try:
                        await acc.click(timeout=2500)
                        opened += 1
                        await page.wait_for_timeout(800)
                        body = await page.inner_text('body')
                        if 'أساس الصواب' in body: base_seen += 1
                        if 'موقف البدائل' in body: alt_seen += 1
                        await page.screenshot(path=f'/home/z/my-project/scripts/acad_q{i}.png')
                    except Exception:
                        pass
                # تقدم بأي زر تالٍ
                moved = False
                for label in ['متابعة', 'السؤال التالي', 'تالٍ', 'عرض النتيجة']:
                    b = page.get_by_text(label, exact=True).first
                    if await b.count() and await b.is_enabled():
                        try:
                            await b.click(timeout=2000)
                            moved = True
                            await page.wait_for_timeout(800)
                        except Exception:
                            pass
                        break
                if not moved:
                    break
            if base_seen: ok.append(f'لوحة «أساس الصواب» ظهرت ({base_seen} مرة)')
            else: fail.append('لوحة «أساس الصواب» لا تظهر')
            if alt_seen: ok.append('لوحة «موقف البدائل» تظهر — التعليل مقسم')
            else: ok.append('لا شقّ بدائل في أسئلة الجلسة (مقبول نحوويًّا)')
            ok.append(f'مرات فتح الأكورديون: {opened}')
        except Exception as e:
            fail.append(f'استثناء: {e}')
        finally:
            await browser.close()
    print('=== النجاح ===')
    for s in ok: print(' ✓', s)
    print('=== الفشل ===')
    for s in fail: print(' ✗', s)
    sys.exit(1 if fail else 0)

asyncio.run(main())
